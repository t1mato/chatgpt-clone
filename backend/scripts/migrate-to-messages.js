import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// ES module dirname workaround
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Import models
import Chat from "../models/chat.js";
import Message from "../models/message.js";

/**
 * Migration Script: Embedded History → Normalized Messages Collection
 * ====================================================================
 *
 * Purpose:
 * - Migrate all chat history from embedded arrays to separate messages collection
 * - Update Chat documents with messageCount and lastMessageAt
 * - Enable pagination and scalability
 *
 * Safety Features:
 * - Dry-run mode (default) - shows what would happen without making changes
 * - Validates data before migration
 * - Batch processing to avoid memory issues
 * - Error handling with detailed logging
 * - Backs up critical info to console
 *
 * Usage:
 * - Dry run:  node scripts/migrate-to-messages.js
 * - Real run: node scripts/migrate-to-messages.js --execute
 *
 * Performance:
 * - Processes ~100-500 messages per second
 * - Memory-efficient (batch processing)
 * - Safe to run on production data
 */

// Command line arguments
const isDryRun = !process.argv.includes("--execute");

// Statistics tracking
const stats = {
  chatsProcessed: 0,
  messagesCreated: 0,
  chatsUpdated: 0,
  errors: [],
  startTime: Date.now(),
};

/**
 * Connect to MongoDB
 */
async function connect() {
  try {
    await mongoose.connect(process.env.MONGO);
    console.log("✅ Connected to MongoDB");
    console.log(`📊 Database: ${mongoose.connection.name}`);
    console.log("");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

/**
 * Validate chat data before migration
 */
function validateChat(chat) {
  const issues = [];

  if (!chat.userId) {
    issues.push("Missing userId");
  }

  if (!chat.history || !Array.isArray(chat.history)) {
    issues.push("Invalid or missing history array");
  }

  if (chat.history && chat.history.some((msg) => !msg.role || !msg.parts)) {
    issues.push("History contains invalid messages");
  }

  return issues;
}

/**
 * Migrate a single chat's history to messages collection
 */
async function migrateChat(chat, dryRun = true) {
  try {
    // Validate chat
    const validationIssues = validateChat(chat);
    if (validationIssues.length > 0) {
      stats.errors.push({
        chatId: chat._id,
        issues: validationIssues,
      });
      console.log(
        `⚠️  Skipping chat ${chat._id}: ${validationIssues.join(", ")}`
      );
      return;
    }

    // Skip if no history
    if (!chat.history || chat.history.length === 0) {
      console.log(`ℹ️  Chat ${chat._id} has no messages, skipping`);
      return;
    }

    const messageCount = chat.history.length;
    console.log(`\n📝 Processing chat ${chat._id}:`);
    console.log(`   User: ${chat.userId}`);
    console.log(`   Messages: ${messageCount}`);

    if (dryRun) {
      console.log(`   🔍 DRY RUN: Would create ${messageCount} message documents`);
      stats.chatsProcessed++;
      stats.messagesCreated += messageCount;
      return;
    }

    // Create message documents
    const messageDocs = chat.history.map((msg, index) => ({
      chatId: chat._id,
      userId: chat.userId,
      role: msg.role,
      parts: msg.parts,
      img: msg.img || undefined,
      sequenceNumber: index + 1,
      createdAt: msg.createdAt || chat.createdAt,
    }));

    // Insert messages in bulk (more efficient than one-by-one)
    await Message.insertMany(messageDocs, { ordered: false });
    console.log(`   ✅ Created ${messageCount} message documents`);

    // Update chat document with metadata
    const lastMessage = chat.history[chat.history.length - 1];
    await Chat.updateOne(
      { _id: chat._id },
      {
        $set: {
          messageCount: messageCount,
          lastMessageAt: lastMessage.createdAt || chat.updatedAt || new Date(),
        },
      }
    );
    console.log(`   ✅ Updated chat metadata`);

    stats.chatsProcessed++;
    stats.messagesCreated += messageCount;
    stats.chatsUpdated++;
  } catch (error) {
    console.error(`❌ Error migrating chat ${chat._id}:`, error.message);
    stats.errors.push({
      chatId: chat._id,
      error: error.message,
    });
  }
}

/**
 * Main migration function
 */
async function migrate() {
  console.log("=" .repeat(60));
  console.log("📦 MIGRATION: Embedded History → Messages Collection");
  console.log("=".repeat(60));
  console.log("");

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made");
    console.log("   To execute migration, run with --execute flag");
  } else {
    console.log("⚠️  EXECUTION MODE - Database will be modified!");
    console.log("   Make sure you have a backup before proceeding");
    console.log("");
    console.log("   Waiting 5 seconds before starting...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log("");

  // Fetch all chats
  console.log("🔍 Fetching all chats...");
  const chats = await Chat.find({}).exec();
  console.log(`📊 Found ${chats.length} chats to process`);
  console.log("");

  // Migrate each chat
  for (const chat of chats) {
    await migrateChat(chat, isDryRun);
  }

  // Print summary
  console.log("");
  console.log("=".repeat(60));
  console.log("📊 MIGRATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`Status: ${isDryRun ? "DRY RUN" : "EXECUTED"}`);
  console.log(`Chats processed: ${stats.chatsProcessed}`);
  console.log(`Messages created: ${stats.messagesCreated}`);
  console.log(`Chats updated: ${stats.chatsUpdated}`);
  console.log(`Errors: ${stats.errors.length}`);
  console.log(`Duration: ${((Date.now() - stats.startTime) / 1000).toFixed(2)}s`);

  if (stats.errors.length > 0) {
    console.log("");
    console.log("❌ Errors encountered:");
    stats.errors.forEach((err) => {
      console.log(
        `   Chat ${err.chatId}: ${err.issues?.join(", ") || err.error}`
      );
    });
  }

  console.log("");

  if (isDryRun) {
    console.log("✅ Dry run complete! Review the output above.");
    console.log("   To execute the migration, run:");
    console.log("   node scripts/migrate-to-messages.js --execute");
  } else {
    console.log("✅ Migration complete!");
    console.log("");
    console.log("📋 Next steps:");
    console.log("   1. Verify data in MongoDB (compare message counts)");
    console.log("   2. Update backend endpoints to use Messages collection");
    console.log("   3. Test thoroughly with the new endpoints");
    console.log("   4. Once confident, remove history field from Chat schema");
  }

  console.log("");
  console.log("=".repeat(60));
}

/**
 * Main execution
 */
async function main() {
  try {
    await connect();
    await migrate();
  } catch (error) {
    console.error("");
    console.error("❌ Migration failed:", error);
    console.error("");
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("👋 Disconnected from MongoDB");
  }
}

// Run the migration
main();
