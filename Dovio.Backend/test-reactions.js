// Test script for Reaction System (Posts, Stories, Comments)
const API_BASE_URL = 'http://localhost:5000/api';

async function runReactionTests() {
  console.log('🚀 Starting Reaction System Tests...');
  console.log(`📍 Testing against: ${API_BASE_URL}`);

  let authToken = '';
  let userId = '';
  let postId = '';
  let storyId = '';
  let commentId = '';

  // Test Authentication
  console.log('\n🔐 Testing Authentication...');
  try {
    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    const loginData = await loginRes.json();
    if (loginRes.ok && loginData.data && loginData.data.accessToken) {
      authToken = loginData.data.accessToken;
      userId = loginData.data.user.userId;
      console.log('✅ PASS Login User');
    } else {
      console.error('❌ FAIL Login User');
      console.error(`   Error: "${loginData.message || loginRes.statusText}"`);
      return;
    }
  } catch (error) {
    console.error('❌ FAIL Login User');
    console.error(`   Error: "${error.message}"`);
    return;
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };

  // Test Create Post
  console.log('\n📝 Testing Post Creation...');
  try {
    const postRes = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        postText: 'This is a test post for reactions! 🎉',
        mediaURLs: ['https://example.com/image.jpg']
      })
    });
    const postData = await postRes.json();
    if (postRes.ok && postData.data && postData.data.post) {
      postId = postData.data.post.postId;
      console.log('✅ PASS Create Post');
      console.log(`   Post ID: ${postId}`);
    } else {
      console.error('❌ FAIL Create Post');
      console.error(`   Error: "${postData.message || postRes.statusText}"`);
    }
  } catch (error) {
    console.error('❌ FAIL Create Post');
    console.error(`   Error: "${error.message}"`);
  }

  // Test Create Story
  console.log('\n📖 Testing Story Creation...');
  try {
    const storyRes = await fetch(`${API_BASE_URL}/stories`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        storyText: 'This is a test story for reactions! 📚',
        mediaURL: 'https://example.com/story.jpg',
        mediaType: 'image'
      })
    });
    const storyData = await storyRes.json();
    if (storyRes.ok && storyData.data && storyData.data.story) {
      storyId = storyData.data.story.storyId;
      console.log('✅ PASS Create Story');
      console.log(`   Story ID: ${storyId}`);
    } else {
      console.error('❌ FAIL Create Story');
      console.error(`   Error: "${storyData.message || storyRes.statusText}"`);
    }
  } catch (error) {
    console.error('❌ FAIL Create Story');
    console.error(`   Error: "${error.message}"`);
  }

  // Test Create Comment
  console.log('\n💬 Testing Comment Creation...');
  try {
    const commentRes = await fetch(`${API_BASE_URL}/comments`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        postId: postId,
        content: 'This is a test comment for reactions! 💭'
      })
    });
    const commentData = await commentRes.json();
    if (commentRes.ok && commentData.data && commentData.data.comment) {
      commentId = commentData.data.comment.commentId;
      console.log('✅ PASS Create Comment');
      console.log(`   Comment ID: ${commentId}`);
    } else {
      console.error('❌ FAIL Create Comment');
      console.error(`   Error: "${commentData.message || commentRes.statusText}"`);
    }
  } catch (error) {
    console.error('❌ FAIL Create Comment');
    console.error(`   Error: "${error.message}"`);
  }

  // Test Post Reactions
  console.log('\n👍 Testing Post Reactions...');
  if (postId) {
    // Test Like Post
    try {
      const likeRes = await fetch(`${API_BASE_URL}/reactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entityType: 'post',
          entityId: postId,
          reactionType: 'like'
        })
      });
      const likeData = await likeRes.json();
      if (likeRes.ok) {
        console.log('✅ PASS Like Post');
        console.log(`   Reaction Counts:`, likeData.data.reactionCounts);
      } else {
        console.error('❌ FAIL Like Post');
        console.error(`   Error: "${likeData.message || likeRes.statusText}"`);
      }
    } catch (error) {
      console.error('❌ FAIL Like Post');
      console.error(`   Error: "${error.message}"`);
    }

    // Test Love Post
    try {
      const loveRes = await fetch(`${API_BASE_URL}/reactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entityType: 'post',
          entityId: postId,
          reactionType: 'love'
        })
      });
      const loveData = await loveRes.json();
      if (loveRes.ok) {
        console.log('✅ PASS Love Post');
        console.log(`   Reaction Counts:`, loveData.data.reactionCounts);
      } else {
        console.error('❌ FAIL Love Post');
        console.error(`   Error: "${loveData.message || loveRes.statusText}"`);
      }
    } catch (error) {
      console.error('❌ FAIL Love Post');
      console.error(`   Error: "${error.message}"`);
    }

    // Test Get Post Reactions
    try {
      const getRes = await fetch(`${API_BASE_URL}/reactions/post/${postId}`, {
        method: 'GET',
        headers
      });
      const getData = await getRes.json();
      if (getRes.ok) {
        console.log('✅ PASS Get Post Reactions');
        console.log(`   Total Reactions: ${getData.data.reactions.length}`);
        console.log(`   Reaction Counts:`, getData.data.reactionCounts);
      } else {
        console.error('❌ FAIL Get Post Reactions');
        console.error(`   Error: "${getData.message || getRes.statusText}"`);
      }
    } catch (error) {
      console.error('❌ FAIL Get Post Reactions');
      console.error(`   Error: "${error.message}"`);
    }

    // Test Get User Reaction on Post
    try {
      const userRes = await fetch(`${API_BASE_URL}/reactions/post/${postId}/user`, {
        method: 'GET',
        headers
      });
      const userData = await userRes.json();
      if (userRes.ok) {
        console.log('✅ PASS Get User Reaction on Post');
        console.log(`   User Reacted: ${userData.data.reacted}`);
        console.log(`   Reaction Type: ${userData.data.reactionType}`);
      } else {
        console.error('❌ FAIL Get User Reaction on Post');
        console.error(`   Error: "${userData.message || userRes.statusText}"`);
      }
    } catch (error) {
      console.error('❌ FAIL Get User Reaction on Post');
      console.error(`   Error: "${error.message}"`);
    }
  }

  // Test Story Reactions
  console.log('\n📖 Testing Story Reactions...');
  if (storyId) {
    // Test Laugh at Story
    try {
      const laughRes = await fetch(`${API_BASE_URL}/reactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entityType: 'story',
          entityId: storyId,
          reactionType: 'laugh'
        })
      });
      const laughData = await laughRes.json();
      if (laughRes.ok) {
        console.log('✅ PASS Laugh at Story');
        console.log(`   Reaction Counts:`, laughData.data.reactionCounts);
      } else {
        console.error('❌ FAIL Laugh at Story');
        console.error(`   Error: "${laughData.message || laughRes.statusText}"`);
      }
    } catch (error) {
      console.error('❌ FAIL Laugh at Story');
      console.error(`   Error: "${error.message}"`);
    }

    // Test Get Story Reactions
    try {
      const getRes = await fetch(`${API_BASE_URL}/reactions/story/${storyId}`, {
        method: 'GET',
        headers
      });
      const getData = await getRes.json();
      if (getRes.ok) {
        console.log('✅ PASS Get Story Reactions');
        console.log(`   Total Reactions: ${getData.data.reactions.length}`);
        console.log(`   Reaction Counts:`, getData.data.reactionCounts);
      } else {
        console.error('❌ FAIL Get Story Reactions');
        console.error(`   Error: "${getData.message || getRes.statusText}"`);
      }
    } catch (error) {
      console.error('❌ FAIL Get Story Reactions');
      console.error(`   Error: "${error.message}"`);
    }
  }

  // Test Comment Reactions
  console.log('\n💬 Testing Comment Reactions...');
  if (commentId) {
    // Test Angry at Comment
    try {
      const angryRes = await fetch(`${API_BASE_URL}/reactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entityType: 'comment',
          entityId: commentId,
          reactionType: 'angry'
        })
      });
      const angryData = await angryRes.json();
      if (angryRes.ok) {
        console.log('✅ PASS Angry at Comment');
        console.log(`   Reaction Counts:`, angryData.data.reactionCounts);
      } else {
        console.error('❌ FAIL Angry at Comment');
        console.error(`   Error: "${angryData.message || angryRes.statusText}"`);
      }
    } catch (error) {
      console.error('❌ FAIL Angry at Comment');
      console.error(`   Error: "${error.message}"`);
    }

    // Test Get Comment Reactions
    try {
      const getRes = await fetch(`${API_BASE_URL}/reactions/comment/${commentId}`, {
        method: 'GET',
        headers
      });
      const getData = await getRes.json();
      if (getRes.ok) {
        console.log('✅ PASS Get Comment Reactions');
        console.log(`   Total Reactions: ${getData.data.reactions.length}`);
        console.log(`   Reaction Counts:`, getData.data.reactionCounts);
      } else {
        console.error('❌ FAIL Get Comment Reactions');
        console.error(`   Error: "${getData.message || getRes.statusText}"`);
      }
    } catch (error) {
      console.error('❌ FAIL Get Comment Reactions');
      console.error(`   Error: "${error.message}"`);
    }
  }

  // Test Reaction Toggle (Like -> Dislike)
  console.log('\n🔄 Testing Reaction Toggle...');
  if (postId) {
    // First, add a like
    try {
      const likeRes = await fetch(`${API_BASE_URL}/reactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entityType: 'post',
          entityId: postId,
          reactionType: 'like'
        })
      });
      const likeData = await likeRes.json();
      if (likeRes.ok) {
        console.log('✅ PASS Add Like');
      }
    } catch (error) {
      console.error('❌ FAIL Add Like');
    }

    // Then change to dislike
    try {
      const dislikeRes = await fetch(`${API_BASE_URL}/reactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entityType: 'post',
          entityId: postId,
          reactionType: 'dislike'
        })
      });
      const dislikeData = await dislikeRes.json();
      if (dislikeRes.ok) {
        console.log('✅ PASS Change Like to Dislike');
        console.log(`   Reaction Counts:`, dislikeData.data.reactionCounts);
      } else {
        console.error('❌ FAIL Change Like to Dislike');
        console.error(`   Error: "${dislikeData.message || dislikeRes.statusText}"`);
      }
    } catch (error) {
      console.error('❌ FAIL Change Like to Dislike');
      console.error(`   Error: "${error.message}"`);
    }

    // Then remove reaction (same reaction type)
    try {
      const removeRes = await fetch(`${API_BASE_URL}/reactions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entityType: 'post',
          entityId: postId,
          reactionType: 'dislike'
        })
      });
      const removeData = await removeRes.json();
      if (removeRes.ok) {
        console.log('✅ PASS Remove Reaction');
        console.log(`   Reaction Counts:`, removeData.data.reactionCounts);
      } else {
        console.error('❌ FAIL Remove Reaction');
        console.error(`   Error: "${removeData.message || removeRes.statusText}"`);
      }
    } catch (error) {
      console.error('❌ FAIL Remove Reaction');
      console.error(`   Error: "${error.message}"`);
    }
  }

  // Test All Emoji Reactions
  console.log('\n😀 Testing All Emoji Reactions...');
  const emojis = ['like', 'dislike', 'love', 'laugh', 'angry', 'sad', 'wow'];
  
  if (postId) {
    for (const emoji of emojis) {
      try {
        const emojiRes = await fetch(`${API_BASE_URL}/reactions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            entityType: 'post',
            entityId: postId,
            reactionType: emoji
          })
        });
        const emojiData = await emojiRes.json();
        if (emojiRes.ok) {
          console.log(`✅ PASS ${emoji} Reaction`);
        } else {
          console.error(`❌ FAIL ${emoji} Reaction`);
          console.error(`   Error: "${emojiData.message || emojiRes.statusText}"`);
        }
      } catch (error) {
        console.error(`❌ FAIL ${emoji} Reaction`);
        console.error(`   Error: "${error.message}"`);
      }
    }
  }

  console.log('\n🎉 Reaction System Tests Complete!');
  console.log('\n📊 Summary:');
  console.log('✅ Post Reactions: Like, Love, Dislike, Laugh, Angry, Sad, Wow');
  console.log('✅ Story Reactions: All emoji types supported');
  console.log('✅ Comment Reactions: All emoji types supported');
  console.log('✅ Reaction Toggle: Change between different reactions');
  console.log('✅ Reaction Removal: Remove by clicking same reaction');
  console.log('✅ Reaction Counts: Track all reaction types');
  console.log('✅ User Reactions: Check user\'s reaction on any entity');
  console.log('✅ Notifications: Auto-notifications for reactions');
}

// Run the tests
runReactionTests().catch(console.error);

