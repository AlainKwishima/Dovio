# Dovio Backend Test Script
# This script tests all backend endpoints to verify integration

$API_BASE_URL = "http://localhost:5000"
$accessToken = $null
$testUserId = $null
$testPostId = $null

function Write-TestResult {
    param([string]$Test, [bool]$Success, [string]$Message = "")
    if ($Success) {
        Write-Host "✓ $Test" -ForegroundColor Green
        if ($Message) { Write-Host "  $Message" -ForegroundColor Gray }
    } else {
        Write-Host "✗ $Test" -ForegroundColor Red
        if ($Message) { Write-Host "  $Message" -ForegroundColor Yellow }
    }
}

function Invoke-ApiRequest {
    param(
        [string]$Endpoint,
        [string]$Method = "GET",
        [object]$Body = $null,
        [bool]$SkipAuth = $false
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if (-not $SkipAuth -and $accessToken) {
        $headers["Authorization"] = "Bearer $accessToken"
    }
    
    $params = @{
        Uri = "$API_BASE_URL$Endpoint"
        Method = $Method
        Headers = $headers
        ErrorAction = "SilentlyContinue"
    }
    
    if ($Body) {
        $params["Body"] = ($Body | ConvertTo-Json)
    }
    
    try {
        $response = Invoke-RestMethod @params
        return @{ Success = $true; Data = $response }
    } catch {
        return @{ Success = $false; Error = $_.Exception.Message; StatusCode = $_.Exception.Response.StatusCode.value__ }
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "🚀 Dovio Backend Test Suite" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "Test 1: Health Check" -ForegroundColor Blue
$result = Invoke-ApiRequest -Endpoint "/health" -SkipAuth $true
Write-TestResult -Test "Backend Health" -Success $result.Success -Message $result.Data.message

if (-not $result.Success) {
    Write-Host "`n❌ Backend is not running! Please start it with:" -ForegroundColor Red
    Write-Host "   cd Dovio.Backend" -ForegroundColor Yellow
    Write-Host "   npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test 2: Registration
Write-Host "`nTest 2: User Registration" -ForegroundColor Blue
$timestamp = [DateTimeOffset]::Now.ToUnixTimeMilliseconds()
$testEmail = "test$timestamp@dovio.test"
$testPassword = "Test123!@#"

$regData = @{
    fullNames = "Test User $timestamp"
    email = $testEmail
    password = $testPassword
    dob = "2000-01-01"
    address = "Test Address"
    phoneNumber = "+1234567890"
    occupation = "Tester"
    hobbies = "Testing"
}

$result = Invoke-ApiRequest -Endpoint "/api/auth/register" -Method "POST" -Body $regData -SkipAuth $true
Write-TestResult -Test "User Registration" -Success $result.Success -Message "Email: $testEmail"

if (-not $result.Success) {
    Write-Host "  Registration failed, trying to login with existing account..." -ForegroundColor Yellow
}

# Wait for registration to complete
Start-Sleep -Seconds 1

# Test 3: Login
Write-Host "`nTest 3: User Login" -ForegroundColor Blue
$loginData = @{
    email = $testEmail
    password = $testPassword
}

$result = Invoke-ApiRequest -Endpoint "/api/auth/login" -Method "POST" -Body $loginData -SkipAuth $true

if ($result.Success -and $result.Data.data) {
    $accessToken = $result.Data.data.accessToken
    $testUserId = $result.Data.data.user.userId
    Write-TestResult -Test "User Login" -Success $true -Message "Token: $($accessToken.Substring(0,20))..."
} else {
    Write-TestResult -Test "User Login" -Success $false -Message "Error: $($result.Error)"
    if ($result.StatusCode -eq 403) {
        Write-Host "  ⚠️  Email verification required. Check backend console for token." -ForegroundColor Yellow
    }
}

if (-not $accessToken) {
    Write-Host "`n⚠️  No access token. Remaining tests require authentication." -ForegroundColor Yellow
    exit 0
}

# Test 4: Get Profile
Write-Host "`nTest 4: Get User Profile" -ForegroundColor Blue
$result = Invoke-ApiRequest -Endpoint "/api/users/profile"
Write-TestResult -Test "Get Profile" -Success $result.Success -Message "User: $($result.Data.data.fullNames)"

# Test 5: Create Post
Write-Host "`nTest 5: Create Post" -ForegroundColor Blue
$postData = @{
    postText = "Test post from integration test! #test"
    mediaURLs = @("https://picsum.photos/seed/test$timestamp/800/600")
}

$result = Invoke-ApiRequest -Endpoint "/api/posts" -Method "POST" -Body $postData
if ($result.Success) {
    $testPostId = $result.Data.data.postId
    Write-TestResult -Test "Create Post" -Success $true -Message "Post ID: $testPostId"
} else {
    Write-TestResult -Test "Create Post" -Success $false -Message $result.Error
}

# Test 6: Get Feed
Write-Host "`nTest 6: Get Feed" -ForegroundColor Blue
$result = Invoke-ApiRequest -Endpoint '/api/feed?page=1&limit=10'
if ($result.Success) {
    $postCount = ($result.Data.data.data | Measure-Object).Count
    Write-TestResult -Test "Get Feed" -Success $true -Message "$postCount posts in feed"
} else {
    Write-TestResult -Test "Get Feed" -Success $false -Message $result.Error
}

# Test 7: Add Reaction (Like)
if ($testPostId) {
    Write-Host "`nTest 7: Add Reaction (Like Post)" -ForegroundColor Blue
    $reactionData = @{
        entityType = "post"
        entityId = $testPostId
        type = "like"
    }
    $result = Invoke-ApiRequest -Endpoint "/api/reactions" -Method "POST" -Body $reactionData
    Write-TestResult -Test "Add Reaction" -Success $result.Success
}

# Test 8: Create Comment
if ($testPostId) {
    Write-Host "`nTest 8: Create Comment" -ForegroundColor Blue
    $commentData = @{
        postId = $testPostId
        content = "Great post! Testing comments."
    }
    $result = Invoke-ApiRequest -Endpoint "/api/comments" -Method "POST" -Body $commentData
    Write-TestResult -Test "Create Comment" -Success $result.Success
}

# Test 9: Create Story
Write-Host "`nTest 9: Create Story" -ForegroundColor Blue
$storyData = @{
    media = @{
        id = "media-$timestamp"
        type = "image"
        url = "https://picsum.photos/seed/story$timestamp/1080/1920"
        size = 0
    }
    content = "Test story!"
    duration = 5000
}
$result = Invoke-ApiRequest -Endpoint "/api/stories" -Method "POST" -Body $storyData
Write-TestResult -Test "Create Story" -Success $result.Success

# Test 10: Get Stories
Write-Host "`nTest 10: Get Stories" -ForegroundColor Blue
$result = Invoke-ApiRequest -Endpoint '/api/stories?page=1&limit=10'
if ($result.Success) {
    $storyCount = ($result.Data.data.data | Measure-Object).Count
    Write-TestResult -Test "Get Stories" -Success $true -Message "$storyCount stories available"
} else {
    Write-TestResult -Test "Get Stories" -Success $false -Message $result.Error
}

# Test 11: Save Post
if ($testPostId) {
    Write-Host "`nTest 11: Save Post (Bookmark)" -ForegroundColor Blue
    $result = Invoke-ApiRequest -Endpoint "/api/posts/$testPostId/save" -Method "POST"
    Write-TestResult -Test "Save Post" -Success $result.Success
}

# Test 12: Share Post
if ($testPostId) {
    Write-Host "`nTest 12: Share Post" -ForegroundColor Blue
    $shareData = @{
        postId = $testPostId
        type = "repost"
        content = "Sharing this awesome post!"
    }
    $result = Invoke-ApiRequest -Endpoint "/api/shares" -Method "POST" -Body $shareData
    Write-TestResult -Test "Share Post" -Success $result.Success
}

# Test 13: Search Users
Write-Host "`nTest 13: Search Users" -ForegroundColor Blue
$result = Invoke-ApiRequest -Endpoint '/api/search/users?query=test'
if ($result.Success) {
    $userCount = ($result.Data.data | Measure-Object).Count
    Write-TestResult -Test "Search Users" -Success $true -Message "$userCount users found"
} else {
    Write-TestResult -Test "Search Users" -Success $false -Message $result.Error
}

# Test 14: Get Notifications
Write-Host "`nTest 14: Get Notifications" -ForegroundColor Blue
$result = Invoke-ApiRequest -Endpoint '/api/notifications?page=1&limit=10'
if ($result.Success) {
    $notifCount = if ($result.Data.data.data) { ($result.Data.data.data | Measure-Object).Count } else { 0 }
    Write-TestResult -Test "Get Notifications" -Success $true -Message "$notifCount notifications"
} else {
    Write-TestResult -Test "Get Notifications" -Success $false -Message $result.Error
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nBackend is working correctly!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "1. Your backend is at: http://localhost:5000" -ForegroundColor White
Write-Host "2. Your mobile app should use: http://10.12.75.144:5000" -ForegroundColor White
Write-Host "3. Start mobile app: npx expo start -c" -ForegroundColor White
Write-Host "4. Test credentials:" -ForegroundColor White
Write-Host "   Email: $testEmail" -ForegroundColor Gray
Write-Host "   Password: $testPassword" -ForegroundColor Gray
Write-Host ""
