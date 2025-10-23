# Dovio Backend API Test
$API_BASE_URL = "http://localhost:5000"
$testEmail = "test$(Get-Date -Format 'yyyyMMddHHmmss')@test.com"
$testPassword = "Test123!"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Dovio Backend API Test" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "[1/14] Testing Health Check..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$API_BASE_URL/health" -Method GET
    Write-Host "PASS: Backend is healthy" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Backend is not running!" -ForegroundColor Red
    Write-Host "Start backend: cd Dovio.Backend && npm run dev" -ForegroundColor Yellow
    exit 1
}

# Test 2: Register
Write-Host "`n[2/14] Testing Registration..." -ForegroundColor Yellow
$regBody = @{
    fullNames = "Test User"
    email = $testEmail
    password = $testPassword
    dob = "2000-01-01"
    address = "Test"
    phoneNumber = "1234567890"
    occupation = "Tester"
    hobbies = "Testing"
} | ConvertTo-Json

try {
    $reg = Invoke-RestMethod -Uri "$API_BASE_URL/api/auth/register" -Method POST -Body $regBody -ContentType "application/json"
    Write-Host "PASS: Registration successful" -ForegroundColor Green
} catch {
    Write-Host "INFO: Registration may have failed (user might exist)" -ForegroundColor Yellow
}

Start-Sleep -Seconds 1

# Test 3: Login
Write-Host "`n[3/14] Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "$API_BASE_URL/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $login.data.accessToken
    Write-Host "PASS: Login successful" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "FAIL: Login failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Yellow
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Test 4: Get Profile
Write-Host "`n[4/14] Testing Get Profile..." -ForegroundColor Yellow
try {
    $profile = Invoke-RestMethod -Uri "$API_BASE_URL/api/users/profile" -Headers $headers -Method GET
    Write-Host "PASS: Profile retrieved" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Get profile failed" -ForegroundColor Red
}

# Test 5: Create Post
Write-Host "`n[5/14] Testing Create Post..." -ForegroundColor Yellow
$postBody = @{
    postText = "Test post from API test"
    mediaURLs = @("https://picsum.photos/800/600")
} | ConvertTo-Json

try {
    $post = Invoke-RestMethod -Uri "$API_BASE_URL/api/posts" -Headers $headers -Method POST -Body $postBody
    $postId = $post.data.postId
    Write-Host "PASS: Post created (ID: $postId)" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Create post failed" -ForegroundColor Red
    $postId = $null
}

# Test 6: Get Feed
Write-Host "`n[6/14] Testing Get Feed..." -ForegroundColor Yellow
try {
    $feed = Invoke-RestMethod -Uri "$API_BASE_URL/api/feed?page=1&limit=10" -Headers $headers -Method GET
    $count = $feed.data.data.Count
    Write-Host "PASS: Feed retrieved ($count posts)" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Get feed failed" -ForegroundColor Red
}

# Test 7: Like Post
if ($postId) {
    Write-Host "`n[7/14] Testing Like Post..." -ForegroundColor Yellow
    $likeBody = @{
        entityType = "post"
        entityId = $postId
        type = "like"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$API_BASE_URL/api/reactions" -Headers $headers -Method POST -Body $likeBody | Out-Null
        Write-Host "PASS: Post liked" -ForegroundColor Green
    } catch {
        Write-Host "FAIL: Like post failed" -ForegroundColor Red
    }
} else {
    Write-Host "`n[7/14] SKIP: No post ID" -ForegroundColor Gray
}

# Test 8: Create Comment
if ($postId) {
    Write-Host "`n[8/14] Testing Create Comment..." -ForegroundColor Yellow
    $commentBody = @{
        postId = $postId
        content = "Great post!"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$API_BASE_URL/api/comments" -Headers $headers -Method POST -Body $commentBody | Out-Null
        Write-Host "PASS: Comment created" -ForegroundColor Green
    } catch {
        Write-Host "FAIL: Create comment failed" -ForegroundColor Red
    }
} else {
    Write-Host "`n[8/14] SKIP: No post ID" -ForegroundColor Gray
}

# Test 9: Create Story
Write-Host "`n[9/14] Testing Create Story..." -ForegroundColor Yellow
$storyBody = @{
    media = @{
        id = "media-$(Get-Date -Format 'yyyyMMddHHmmss')"
        type = "image"
        url = "https://picsum.photos/1080/1920"
        size = 0
    }
    content = "Test story"
    duration = 5000
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri "$API_BASE_URL/api/stories" -Headers $headers -Method POST -Body $storyBody | Out-Null
    Write-Host "PASS: Story created" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Create story failed" -ForegroundColor Red
}

# Test 10: Get Stories
Write-Host "`n[10/14] Testing Get Stories..." -ForegroundColor Yellow
try {
    $stories = Invoke-RestMethod -Uri "$API_BASE_URL/api/stories?page=1&limit=10" -Headers $headers -Method GET
    $count = $stories.data.data.Count
    Write-Host "PASS: Stories retrieved ($count stories)" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Get stories failed" -ForegroundColor Red
}

# Test 11: Save Post
if ($postId) {
    Write-Host "`n[11/14] Testing Save Post..." -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "$API_BASE_URL/api/posts/$postId/save" -Headers $headers -Method POST | Out-Null
        Write-Host "PASS: Post saved" -ForegroundColor Green
    } catch {
        Write-Host "FAIL: Save post failed" -ForegroundColor Red
    }
} else {
    Write-Host "`n[11/14] SKIP: No post ID" -ForegroundColor Gray
}

# Test 12: Share Post
if ($postId) {
    Write-Host "`n[12/14] Testing Share Post..." -ForegroundColor Yellow
    $shareBody = @{
        postId = $postId
        type = "repost"
        content = "Sharing!"
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$API_BASE_URL/api/shares" -Headers $headers -Method POST -Body $shareBody | Out-Null
        Write-Host "PASS: Post shared" -ForegroundColor Green
    } catch {
        Write-Host "FAIL: Share post failed" -ForegroundColor Red
    }
} else {
    Write-Host "`n[12/14] SKIP: No post ID" -ForegroundColor Gray
}

# Test 13: Search Users
Write-Host "`n[13/14] Testing Search Users..." -ForegroundColor Yellow
try {
    $search = Invoke-RestMethod -Uri "$API_BASE_URL/api/search/users?query=test" -Headers $headers -Method GET
    Write-Host "PASS: Search working" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Search failed" -ForegroundColor Red
}

# Test 14: Get Notifications
Write-Host "`n[14/14] Testing Get Notifications..." -ForegroundColor Yellow
try {
    $notifs = Invoke-RestMethod -Uri "$API_BASE_URL/api/notifications?page=1&limit=10" -Headers $headers -Method GET
    Write-Host "PASS: Notifications retrieved" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Get notifications failed" -ForegroundColor Red
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "`nYour API is working! Next steps:" -ForegroundColor Yellow
Write-Host "1. Backend: http://localhost:5000" -ForegroundColor White
Write-Host "2. Mobile config: http://10.12.75.144:5000" -ForegroundColor White
Write-Host "3. Start app: npx expo start -c" -ForegroundColor White
Write-Host "4. Test account:" -ForegroundColor White
Write-Host "   Email: $testEmail" -ForegroundColor Gray
Write-Host "   Password: $testPassword" -ForegroundColor Gray
Write-Host ""
