-- Drop order for re-runs (safe: children first)
DROP TABLE IF EXISTS group_members;
DROP TABLE IF EXISTS study_sessions;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS progress;
DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS topics;
DROP TABLE IF EXISTS study_groups;

-- Users & profiles
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  google_sub VARCHAR(64) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(512) NULL,
  university VARCHAR(255) NULL,
  course VARCHAR(255) NULL,
  year_of_study TINYINT NULL,
  bio TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
);

-- Study topics & chapters
CREATE TABLE IF NOT EXISTS topics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  created_by BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_topics_user
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chapters (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  topic_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  order_index INT DEFAULT 0,
  PRIMARY KEY (id),
  CONSTRAINT fk_chapters_topic
    FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

-- Study groups (rename from reserved 'groups' -> 'study_groups')
CREATE TABLE IF NOT EXISTS study_groups (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_by BIGINT UNSIGNED NULL,                 -- allow NULL because of ON DELETE SET NULL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_study_groups_user
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS group_members (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  group_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  role ENUM('owner','member') DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_group_user (group_id, user_id),
  CONSTRAINT fk_members_group
    FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE,
  CONSTRAINT fk_members_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions (avoid reserved 'session'; 'sessions' is fine but we’ll be explicit)
CREATE TABLE IF NOT EXISTS study_sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  group_id BIGINT UNSIGNED NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  location VARCHAR(255),
  agenda TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_sessions_group
    FOREIGN KEY (group_id) REFERENCES study_groups(id) ON DELETE CASCADE
);

-- Progress tracking
CREATE TABLE IF NOT EXISTS progress (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  chapter_id BIGINT UNSIGNED NOT NULL,
  status ENUM('not_started','in_progress','completed') DEFAULT 'not_started',
  hours DECIMAL(6,2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_user_chapter (user_id, chapter_id),
  CONSTRAINT fk_progress_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_progress_chapter
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

-- Notifications / reminders
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(64) NOT NULL,
  payload JSON,
  is_read BOOLEAN DEFAULT FALSE,
  scheduled_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Helpful indexes
CREATE INDEX idx_users_course_year ON users(course, year_of_study);
CREATE INDEX idx_topics_title ON topics(title);
CREATE INDEX idx_groups_name ON study_groups(name);
