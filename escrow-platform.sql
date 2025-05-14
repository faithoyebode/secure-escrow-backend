
-- SQLite schema for Escrow Platform

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) NOT NULL DEFAULT 'buyer',
    avatar VARCHAR(255),
    walletBalance FLOAT DEFAULT 0,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price FLOAT NOT NULL,
    image VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    sellerId VARCHAR(36) NOT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sellerId) REFERENCES users(id) ON DELETE CASCADE
);

-- Escrows table
CREATE TABLE escrows (
    id VARCHAR(36) PRIMARY KEY,
    amount FLOAT NOT NULL,
    buyerId VARCHAR(36) NOT NULL,
    sellerId VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'awaiting_delivery',
    expiryDate DATETIME,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (buyerId) REFERENCES users(id),
    FOREIGN KEY (sellerId) REFERENCES users(id)
);

-- Escrow Products table (new)
CREATE TABLE escrow_products (
    id VARCHAR(36) PRIMARY KEY,
    escrowId VARCHAR(36) NOT NULL,
    productId VARCHAR(36) NOT NULL,
    price FLOAT NOT NULL,
    quantity INT DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (escrowId) REFERENCES escrows(id) ON DELETE CASCADE,
    FOREIGN KEY (productId) REFERENCES products(id)
);

-- Disputes table
CREATE TABLE disputes (
    id VARCHAR(36) PRIMARY KEY,
    escrowId VARCHAR(36) NOT NULL,
    raisedBy VARCHAR(10) NOT NULL,
    userId VARCHAR(36) NOT NULL,
    userName VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    evidence TEXT NOT NULL, -- JSON array of file paths
    status VARCHAR(10) NOT NULL DEFAULT 'pending',
    adminNotes TEXT,
    resolvedAt DATETIME,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (escrowId) REFERENCES escrows(id),
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Dispute Comments table
CREATE TABLE dispute_comments (
    id VARCHAR(36) PRIMARY KEY,
    disputeId VARCHAR(36) NOT NULL,
    userId VARCHAR(36) NOT NULL,
    userName VARCHAR(255) NOT NULL,
    userRole VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    attachments TEXT NOT NULL, -- JSON array of file paths
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (disputeId) REFERENCES disputes(id) ON DELETE CASCADE,
    FOREIGN KEY (userId) REFERENCES users(id)
);

-- Initial admin user (password: admin123)
INSERT INTO users (id, name, email, password, role) VALUES
('admin-uuid', 'Admin User', 'admin@escrow.com', '$2b$10$HASHED_PASSWORD', 'admin');
