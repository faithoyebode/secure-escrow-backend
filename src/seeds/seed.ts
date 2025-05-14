
import "reflect-metadata";
import * as bcrypt from "bcrypt";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Product } from "../entity/Product";

const seedDatabase = async () => {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log("Database connection initialized");

    // Clear existing data
    await AppDataSource.getRepository(Product).clear();
    await AppDataSource.getRepository(User).clear();
    console.log("Cleared existing data");

    // Create users
    const userRepository = AppDataSource.getRepository(User);
    
    // Create admin
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin = userRepository.create({
      name: "Admin User",
      email: "admin@escrow.com",
      password: adminPassword,
      role: "admin",
      avatar: "/placeholder.svg",
      walletBalance: 0
    });
    await userRepository.save(admin);
    console.log("Created admin user");
    
    // Create sellers
    const sellerPassword = await bcrypt.hash("seller123", 10);
    const seller1 = userRepository.create({
      name: "John Doe",
      email: "john@example.com",
      password: sellerPassword,
      role: "seller",
      avatar: "/placeholder.svg",
      walletBalance: 1500
    });
    
    const seller2 = userRepository.create({
      name: "Sarah Smith",
      email: "sarah@example.com",
      password: sellerPassword,
      role: "seller",
      avatar: "/placeholder.svg",
      walletBalance: 2500
    });
    
    await userRepository.save([seller1, seller2]);
    console.log("Created seller users");
    
    // Create buyers
    const buyerPassword = await bcrypt.hash("buyer123", 10);
    const buyer1 = userRepository.create({
      name: "Alice Johnson",
      email: "alice@example.com",
      password: buyerPassword,
      role: "buyer",
      avatar: "/placeholder.svg",
      walletBalance: 5000
    });
    
    const buyer2 = userRepository.create({
      name: "Bob Williams",
      email: "bob@example.com",
      password: buyerPassword,
      role: "buyer",
      avatar: "/placeholder.svg",
      walletBalance: 3000
    });
    
    await userRepository.save([buyer1, buyer2]);
    console.log("Created buyer users");
    
    // Create products
    const productRepository = AppDataSource.getRepository(Product);
    
    const electronicsProducts = [
      {
        name: "Professional Laptop",
        description: "High-performance laptop with 16GB RAM and 512GB SSD",
        price: 1299.99,
        image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2342&q=80",
        category: "electronics",
        sellerId: seller1.id
      },
      {
        name: "Wireless Noise-Cancelling Headphones",
        description: "Over-ear headphones with active noise cancellation",
        price: 199.99,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80",
        category: "electronics",
        sellerId: seller2.id
      },
      {
        name: "Smart Watch",
        description: "Fitness tracking and notifications on your wrist",
        price: 149.99,
        image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd6b0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1288&q=80",
        category: "electronics",
        sellerId: seller2.id
      },
      {
        name: "Professional DSLR Camera",
        description: "24.1 Megapixel DSLR camera with 18-55mm lens",
        price: 899.99,
        image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80",
        category: "electronics",
        sellerId: seller2.id
      },
      {
        name: "4K Ultra HD Smart TV",
        description: "55-inch 4K television with HDR support",
        price: 799.99,
        image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80",
        category: "electronics",
        sellerId: seller1.id
      }
    ];
    
    const furnitureProducts = [
      {
        name: "Ergonomic Office Chair",
        description: "Adjustable office chair with lumbar support",
        price: 249.99,
        image: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80",
        category: "furniture",
        sellerId: seller1.id
      },
      {
        name: "Wooden Coffee Table",
        description: "Handcrafted coffee table made from sustainable wood",
        price: 399.99,
        image: "https://images.unsplash.com/photo-1595500381751-d934db3cc924?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80",
        category: "furniture",
        sellerId: seller1.id
      },
      {
        name: "Modular Sectional Sofa",
        description: "Customizable sofa sections for your living room",
        price: 1299.99,
        image: "https://images.unsplash.com/photo-1540574163026-643ea20ade25?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80",
        category: "furniture",
        sellerId: seller2.id
      },
      {
        name: "Queen Size Bed Frame",
        description: "Modern bed frame with headboard and under-bed storage",
        price: 599.99,
        image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80",
        category: "furniture",
        sellerId: seller2.id
      }
    ];
    
    const fashionProducts = [
      {
        name: "Designer Leather Wallet",
        description: "Genuine leather wallet with multiple card slots",
        price: 79.99,
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80",
        category: "fashion",
        sellerId: seller1.id
      },
      {
        name: "Premium Wristwatch",
        description: "Stainless steel watch with Japanese movement",
        price: 299.99,
        image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80",
        category: "fashion",
        sellerId: seller2.id
      },
      {
        name: "Italian Leather Shoes",
        description: "Handcrafted oxford shoes made from Italian leather",
        price: 249.99,
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80",
        category: "fashion",
        sellerId: seller1.id
      },
      {
        name: "Designer Sunglasses",
        description: "UV-protected polarized sunglasses with carrying case",
        price: 159.99,
        image: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80",
        category: "fashion",
        sellerId: seller2.id
      }
    ];
    
    const booksProducts = [
      {
        name: "Programming Language Reference",
        description: "Comprehensive guide to modern programming languages",
        price: 49.99,
        image: "https://images.unsplash.com/photo-1532012197267-da84d127e765?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80",
        category: "books",
        sellerId: seller1.id
      },
      {
        name: "Science Fiction Collection",
        description: "Box set of best-selling science fiction novels",
        price: 89.99,
        image: "https://images.unsplash.com/photo-1531901599143-df8826d9f534?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&q=80",
        category: "books",
        sellerId: seller2.id
      }
    ];
    
    const products = [...electronicsProducts, ...furnitureProducts, ...fashionProducts, ...booksProducts];
    
    for (const product of products) {
      await productRepository.save(productRepository.create(product));
    }
    
    console.log("Created products");
    console.log(`Total products created: ${products.length}`);
    
    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    // Close the connection
    await AppDataSource.destroy();
    console.log("Database connection closed");
  }
};

// Run the seed function
seedDatabase();
