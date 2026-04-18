# Full Social Network App - Project Planning Document

---

## 📱 PART 1: APP NAMING & BRANDING

### Option 1: Naming Ideas
Below are some app name suggestions. Pick one or suggest your own!

#### Tech/Modern Names:
- **ConnectHub** - Professional, clear intent
- **SocialSync** - Emphasizes real-time connection
- **ThreadFlow** - Posts/threads flowing naturally
- **LinkUp** - Simple, friendly, connection-focused
- **VoxHub** - "Vox" = voice/community
- **PulseLink** - Real-time heartbeat of connections
- **EchoNet** - Echoing voices across networks
- **MindShare** - Sharing ideas and thoughts

#### Creative/Catchy Names:
- **Cirrus** - Cloud-based social platform
- **Kinship** - Emphasizes relationships
- **Mosaic** - Different people creating one picture
- **Traverse** - Navigate through connections
- **Ember** - Glowing community interactions
- **Beacon** - Helping people discover each other
- **Catalyst** - Sparking conversations

#### Simple/Direct Names:
- **Social.io**
- **Circle** - Simple community concept
- **Nexus** - Central connection point
- **Folk** - Friendly, community-oriented
- **Gather** - Bringing people together

### Your Choice:
**Selected App Name:** ___________________

**Tagline/Slogan:** ___________________

**Color Scheme (choose or suggest):**
- Option A: Blue & Purple (trust + creativity)
- Option B: Teal & Orange (modern + friendly)
- Option C: Indigo & Pink (trendy + vibrant)
- Option D: Custom: ___________________

---

## 🗄️ PART 2: DATABASE SCHEMA

### 2.1 Core Tables

#### Table 1: `users`
Stores user account information
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(100),
  bio TEXT,
  avatar_url VARCHAR(500),
  cover_photo_url VARCHAR(500),
  location VARCHAR(100),
  website VARCHAR(255),
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  CONSTRAINT username_lowercase CHECK (username = LOWER(username))
);
```

#### Table 2: `posts`
Stores user posts/content
```sql
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_urls TEXT[] DEFAULT ARRAY[]::TEXT[],
  visibility VARCHAR(20) DEFAULT 'public', -- public, friends_only, private
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP, -- For story-like posts
  is_deleted BOOLEAN DEFAULT FALSE,
  
  CONSTRAINT visibility_check CHECK (visibility IN ('public', 'friends_only', 'private'))
);
```

#### Table 3: `comments`
Stores comments on posts
```sql
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For nested replies
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE
);
```

#### Table 4: `post_likes`
Tracks likes on posts
```sql
CREATE TABLE post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(post_id, user_id) -- A user can only like a post once
);
```

#### Table 5: `comment_likes`
Tracks likes on comments
```sql
CREATE TABLE comment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(comment_id, user_id)
);
```

#### Table 6: `follows`
Manages follow relationships
```sql
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(follower_id, following_id),
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);
```

#### Table 7: `friend_requests`
Manages friend request system (for private accounts)
```sql
CREATE TABLE friend_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected, blocked
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  responded_at TIMESTAMP,
  
  UNIQUE(sender_id, receiver_id),
  CONSTRAINT no_self_request CHECK (sender_id != receiver_id),
  CONSTRAINT status_check CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked'))
);
```

#### Table 8: `blocks`
Manages blocked users
```sql
CREATE TABLE blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(blocker_id, blocked_id),
  CONSTRAINT no_self_block CHECK (blocker_id != blocked_id)
);
```

#### Table 9: `conversations`
Stores chat conversations (1-on-1 and group)
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(10) DEFAULT 'direct', -- direct, group
  name VARCHAR(100), -- For group chats
  creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Table 10: `conversation_members`
Members in a conversation
```sql
CREATE TABLE conversation_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_read_at TIMESTAMP,
  
  UNIQUE(conversation_id, user_id)
);
```

#### Table 11: `messages`
Stores chat messages
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url VARCHAR(500),
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE
);
```

#### Table 12: `hashtags`
Stores hashtags
```sql
CREATE TABLE hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag VARCHAR(100) UNIQUE NOT NULL,
  usage_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT tag_format CHECK (tag ~* '^[a-z0-9_]+$')
);
```

#### Table 13: `post_hashtags`
Junction table for posts and hashtags
```sql
CREATE TABLE post_hashtags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES hashtags(id) ON DELETE CASCADE,
  
  UNIQUE(post_id, hashtag_id)
);
```

#### Table 14: `mentions`
Stores @mentions
```sql
CREATE TABLE mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CHECK (post_id IS NOT NULL OR comment_id IS NOT NULL)
);
```

#### Table 15: `notifications`
Stores user notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- like, comment, follow, friend_request, mention
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Who triggered the notification
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT type_check CHECK (type IN ('like', 'comment', 'follow', 'friend_request', 'mention', 'message'))
);
```

#### Table 16: `user_sessions`
Tracks user sessions for presence/online status
```sql
CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_online BOOLEAN DEFAULT TRUE,
  
  UNIQUE(user_id)
);
```

---

### 2.2 Database Indexes (for Performance)

```sql
-- Indexes for faster queries
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_visibility ON posts(visibility);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, read);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_post_likes_post ON post_likes(post_id);
CREATE INDEX idx_post_likes_user ON post_likes(user_id);
```

---

## 🏗️ PART 3: SYSTEM DESIGN & ARCHITECTURE

### 3.1 High-Level System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   React Frontend                     │
│  (Components, Pages, State Management - Zustand)    │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│              Supabase Client Library                 │
│  (@supabase/supabase-js)                            │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    ┌────────┐  ┌────────┐  ┌──────────┐
    │  Auth  │  │Database│  │ Storage  │
    └────────┘  └────────┘  └──────────┘
        │            │            │
        └────────────┼────────────┘
                     ▼
        ┌───────────────────────────┐
        │ Supabase Backend          │
        │ (PostgreSQL + Realtime)   │
        └───────────────────────────┘
```

### 3.2 Frontend Architecture

```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── SignupForm.jsx
│   │   └── AuthGuard.jsx
│   ├── layout/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   └── MainLayout.jsx
│   ├── posts/
│   │   ├── PostCard.jsx
│   │   ├── CreatePostModal.jsx
│   │   ├── PostActions.jsx
│   │   └── CommentSection.jsx
│   ├── profile/
│   │   ├── ProfileHeader.jsx
│   │   ├── ProfileStats.jsx
│   │   └── EditProfileModal.jsx
│   ├── chat/
│   │   ├── ConversationList.jsx
│   │   ├── ChatWindow.jsx
│   │   ├── MessageInput.jsx
│   │   └── TypingIndicator.jsx
│   ├── notifications/
│   │   ├── NotificationBell.jsx
│   │   ├── NotificationPanel.jsx
│   │   └── NotificationItem.jsx
│   └── user/
│       ├── UserCard.jsx
│       ├── UserSearch.jsx
│       └── FollowButton.jsx
├── pages/
│   ├── Home.jsx
│   ├── Profile.jsx
│   ├── Chat.jsx
│   ├── Discover.jsx
│   ├── Notifications.jsx
│   └── Search.jsx
├── hooks/
│   ├── useAuth.js
│   ├── usePosts.js
│   ├── useChat.js
│   ├── useNotifications.js
│   └── useFollow.js
├── services/
│   ├── authService.js
│   ├── postService.js
│   ├── chatService.js
│   ├── userService.js
│   └── notificationService.js
├── store/ (Zustand)
│   ├── authStore.js
│   ├── postStore.js
│   ├── chatStore.js
│   └── userStore.js
├── utils/
│   ├── supabase.js
│   ├── validators.js
│   ├── formatters.js
│   └── constants.js
├── App.jsx
└── main.jsx
```

### 3.3 Data Flow

#### 1. Authentication Flow
```
User Signup/Login
    ↓
Supabase Auth API
    ↓
JWT Token Generated
    ↓
Stored in Local Storage
    ↓
Used for Subsequent API Calls
```

#### 2. Post Creation Flow
```
User writes post + uploads image
    ↓
Frontend validation
    ↓
Upload image to Supabase Storage
    ↓
Get image URL
    ↓
Insert post record in database
    ↓
RLS policy checks user_id
    ↓
Post visible in feed via real-time subscription
```

#### 3. Real-time Feed Flow
```
Subscribe to posts table
    ↓
Listen for INSERT, UPDATE, DELETE events
    ↓
Supabase Realtime broadcasts change
    ↓
Component receives new post/update
    ↓
UI updates instantly without refetch
```

#### 4. Notification Flow
```
User A likes User B's post
    ↓
Insert into post_likes table
    ↓
Trigger creates notification record
    ↓
Real-time subscription notifies User B
    ↓
Notification bell shows new notification
    ↓
User B clicks → navigates to post
```

### 3.4 Key Features Architecture

#### Feature 1: User Profiles
```
Profile Page Shows:
├── User Avatar & Cover Photo
├── Bio, Location, Website
├── Follow/Unfollow Button
├── Follower/Following Counts
├── User's Posts (paginated)
├── Privacy Status
└── Edit Profile (if own profile)

Queries Needed:
- Get user by username
- Get user's posts
- Get follower count
- Check follow status
- Check block status
```

#### Feature 2: Feed System
```
Home Feed Shows:
├── Posts from users being followed
├── Posts from mutual friends
└── Sorted by creation time (newest first)

Real-time Updates:
- New posts appear instantly
- New comments appear instantly
- Like counts update instantly
- Comments deleted in real-time

Query Strategy:
- Initial load: fetch 10-20 posts
- Pagination: load more on scroll
- Real-time: subscribe to changes
- Cache: store in Zustand state
```

#### Feature 3: Search & Discovery
```
Search Functionality:
├── Search users by username/full_name
├── Search posts by content (full-text)
├── Search hashtags
└── Trending hashtags

Discovery Page Shows:
├── Suggested users to follow
├── Trending posts
├── Popular hashtags
└── Explore different feeds
```

#### Feature 4: Chat System
```
One-to-One Chat:
- Direct conversation between 2 users
- Real-time message delivery
- Read receipts
- Typing indicators
- Online status

Group Chat:
- Multiple participants
- Shared conversation thread
- Message history

Real-time Features:
- Subscribe to messages in conversation
- Subscribe to typing indicators
- Subscribe to presence changes
```

#### Feature 5: Notifications
```
Notification Types:
├── Like on your post
├── Comment on your post
├── Follow from someone
├── Friend request received
├── Mention (@user) in post/comment
└── New message in chat

Real-time Delivery:
- Subscribe to notifications table
- Filter for current user
- Mark as read when clicked
- Badge shows unread count
```

### 3.5 Performance Optimization Strategies

#### 1. Query Optimization
```javascript
// ❌ SLOW: N+1 query problem
const posts = await supabase.from('posts').select('*')
for (const post of posts) {
  const author = await supabase.from('users').select('*').eq('id', post.user_id)
}

// ✅ FAST: Join in single query
const posts = await supabase
  .from('posts')
  .select('*, author:user_id(id, username, avatar_url)')
```

#### 2. Pagination
```javascript
// Load 10 posts at a time
const { data: posts } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false })
  .range(0, 9)

// Load more on scroll
const { data: morePosts } = await supabase
  .from('posts')
  .select('*')
  .order('created_at', { ascending: false })
  .range(10, 19)
```

#### 3. Caching Strategy
```javascript
// Use React Query for automatic caching
useQuery(['posts'], fetchPosts, {
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
})
```

#### 4. Image Optimization
```javascript
// Store images in multiple sizes
avatars/
├── {userId}/avatar-small.jpg (50x50)
├── {userId}/avatar-medium.jpg (150x150)
└── {userId}/avatar-large.jpg (300x300)

// Load appropriate size based on context
<img src={getImageUrl(userId, 'small')} />
```

#### 5. Lazy Loading
```javascript
// Load images only when visible
<img loading="lazy" src={postImageUrl} />

// Virtual scrolling for large feeds
import { FixedSizeList } from 'react-window'
```

### 3.6 Security Architecture

#### 1. Row Level Security (RLS) Policies

```sql
-- Users can only read public posts
CREATE POLICY "Public posts are readable"
ON posts FOR SELECT
USING (visibility = 'public');

-- Users can only read friends-only posts from users they follow
CREATE POLICY "Friends-only posts"
ON posts FOR SELECT
USING (
  visibility = 'friends_only' 
  AND user_id IN (
    SELECT following_id FROM follows 
    WHERE follower_id = auth.uid()
  )
);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Users can't see posts from blocked users
CREATE POLICY "Hide blocked users posts"
ON posts FOR SELECT
USING (
  user_id NOT IN (
    SELECT blocked_id FROM blocks 
    WHERE blocker_id = auth.uid()
  )
  AND
  user_id NOT IN (
    SELECT blocker_id FROM blocks 
    WHERE blocked_id = auth.uid()
  )
);
```

#### 2. Input Validation
```javascript
// Frontend validation
const validatePost = (content) => {
  if (!content || content.trim().length === 0) throw new Error('Empty post')
  if (content.length > 5000) throw new Error('Post too long')
  return true
}

// Backend RLS ensures user_id matches auth.uid()
```

#### 3. CORS & API Security
```
- Supabase handles CORS
- JWT tokens are automatically included
- API keys are environment variables
- Never expose anon key in secrets
```

### 3.7 Scalability Considerations

#### 1. Database Scaling
```
- PostgreSQL can handle millions of records
- Use proper indexes (already defined)
- Archive old data (soft deletes with deleted_at)
- Use partitioning for very large tables (future)
```

#### 2. File Storage Scaling
```
- Supabase Storage uses cloud storage
- Organize by type: avatars/, posts/, chat/
- Implement cleanup for deleted posts/avatars
- Use CDN for image delivery (built-in)
```

#### 3. Real-time Scaling
```
- Supabase Realtime is managed
- Avoid subscribing to huge tables
- Use filters: .on('*', callback).eq('user_id', userId)
- Unsubscribe when component unmounts
```

---

## 📋 PART 4: FEATURE CHECKLIST

### Must-Have Features
- [ ] User Authentication (Sign up, Login, Logout)
- [ ] User Profiles (View, Edit)
- [ ] Create Posts with text and images
- [ ] Like/Unlike posts
- [ ] Comment on posts
- [ ] Follow/Unfollow users
- [ ] View home feed
- [ ] Real-time notifications
- [ ] User search/discovery

### Nice-to-Have Features
- [ ] Friend requests (for private accounts)
- [ ] Block users
- [ ] Direct messaging
- [ ] Hashtag system
- [ ] @mention notifications
- [ ] Edit posts
- [ ] Delete posts
- [ ] Comment nested replies
- [ ] Trending posts
- [ ] Trending hashtags

### Advanced Features
- [ ] Story-like ephemeral posts (24h expiry)
- [ ] Group chats
- [ ] Read receipts
- [ ] Typing indicators
- [ ] Online status
- [ ] Image optimization
- [ ] Full-text search
- [ ] Privacy controls
- [ ] Activity timeline
- [ ] Export user data

---

## 🚀 NEXT STEPS

1. **Confirm App Name & Design**
   - Choose app name from options
   - Select color scheme
   - Define branding guidelines

2. **Supabase Project Setup**
   - Create Supabase account
   - Create new project
   - Set up database (run SQL schemas)
   - Configure authentication
   - Set up storage buckets

3. **Frontend Skeleton**
   - Create React + Vite project
   - Set up Zustand stores
   - Create basic layout/routing
   - Implement auth flow

4. **Start with Project 1 Features**
   - User signup/login
   - User profile creation/editing
   - Basic profile view

5. **Iteratively Add Features**
   - Posts creation and display
   - Comments and likes
   - Follow system
   - Chat
   - Notifications

---

## 💾 DATABASE SUMMARY

**Total Tables: 16**
- Core: users, posts, comments
- Engagement: post_likes, comment_likes, follows
- Social: friend_requests, blocks
- Chat: conversations, conversation_members, messages
- Discovery: hashtags, post_hashtags, mentions
- System: notifications, user_sessions

**Total Indexes: 11** (for optimal query performance)

**Storage Buckets Needed:**
1. `avatars` - User profile pictures
2. `cover_photos` - User cover images
3. `post_images` - Images in posts
4. `chat_images` - Images in messages

---

This document is your blueprint. Let's confirm the app name and any modifications to the schema, then we'll start building! 🎉