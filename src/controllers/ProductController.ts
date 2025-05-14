
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Product } from "../entity/Product";
import { User } from "../entity/User";
import { getFileUrl } from "../middleware/upload";
import { AuthRequest } from "../middleware/auth";

export class ProductController {
  private productRepository = AppDataSource.getRepository(Product);
  private userRepository = AppDataSource.getRepository(User);

  // Get all products
  async getAllProducts(req: Request, res: Response) {
    try {
      const { category, search, price } = req.query;
      let filter = null
      if (typeof price === 'object' && !Array.isArray(price)) {
        filter = {
          gte: price?.["gte"] ? Number(price["gte"]) : null,
          lte: price?.["lte"] ? Number(price["lte"]) : null,
        };
      }
      
      let query = this.productRepository
        .createQueryBuilder("product")
        .leftJoinAndSelect("product.seller", "seller")
        .select([
          "product.id",
          "product.name",
          "product.description",
          "product.price",
          "product.image",
          "product.category",
          "product.sellerId",
          "seller.name",
          "product.createdAt",
          "product.updatedAt"
        ]);

      // Apply filters if provided
      if (category) {
        query = query.where("product.category = :category", { 
          category: String(category) 
        });
      }

      if (search) {
        query = query.andWhere(
          "(product.name LIKE :search OR product.description LIKE :search)",
          { search: `%${search}%` }
        );
      }

      if (typeof filter?.gte == 'number' && typeof filter?.lte == 'number') {
        query = query.andWhere("product.price >= :gte", { gte: filter.gte });
        query = query.andWhere("product.price <= :lte", { lte: filter.lte });
      }

      const products = await query.getMany();

      // Transform to match frontend model
      const transformedProducts = products.map(product => ({
        ...product,
        sellerName: product.seller.name
      }));

      res.json(transformedProducts);
    } catch (error) {
      console.error("Get products error:", error);
      res.status(500).json({ message: "Failed to get products" });
    }
  }

  // Get product by ID
  async getProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const product = await this.productRepository
        .createQueryBuilder("product")
        .leftJoinAndSelect("product.seller", "seller")
        .select([
          "product.id",
          "product.name",
          "product.description",
          "product.price",
          "product.image",
          "product.category",
          "product.sellerId",
          "seller.name",
          "product.createdAt",
          "product.updatedAt"
        ])
        .where("product.id = :id", { id })
        .getOne();

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Transform to match frontend model
      const transformedProduct = {
        ...product,
        sellerName: product.seller.name
      };

      res.json(transformedProduct);
    } catch (error) {
      console.error("Get product error:", error);
      res.status(500).json({ message: "Failed to get product" });
    }
  }

  // Create new product
  async createProduct(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { name, description, price, category } = req.body;
      const sellerId = req.user.id;

      // Validate required fields
      if (!name || !description || !price || !category) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Validate user is a seller
      if (req.user.role !== "seller") {
        return res.status(403).json({ message: "Only sellers can create products" });
      }

      // Handle image upload
      let imagePath = "placeholder.svg"; // Default image
      if (req.file) {
        imagePath = getFileUrl(req.file.filename);
      }

      // Create product
      const product = this.productRepository.create({
        name,
        description,
        price: parseFloat(price),
        image: imagePath,
        category,
        sellerId
      });

      await this.productRepository.save(product);

      // Fetch seller name for response
      const seller = await this.userRepository.findOneBy({ id: sellerId });
      
      // Format response to match frontend model
      const responseProduct = {
        ...product,
        sellerName: seller?.name || "Unknown Seller"
      };

      res.status(201).json(responseProduct);
    } catch (error) {
      console.error("Create product error:", error);
      res.status(500).json({ message: "Failed to create product" });
    }
  }

  // Update product
  async updateProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, price, category } = req.body;
      
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const product = await this.productRepository.findOneBy({ id });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check ownership or admin status
      if (product.sellerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to update this product" });
      }

      // Update fields
      if (name) product.name = name;
      if (description) product.description = description;
      if (price) product.price = parseFloat(price);
      if (category) product.category = category;

      // Update image if provided
      if (req.file) {
        product.image = getFileUrl(req.file.filename);
      }

      await this.productRepository.save(product);

      // Fetch seller name for response
      const seller = await this.userRepository.findOneBy({ id: product.sellerId });
      
      // Format response to match frontend model
      const responseProduct = {
        ...product,
        sellerName: seller?.name || "Unknown Seller"
      };

      res.json(responseProduct);
    } catch (error) {
      console.error("Update product error:", error);
      res.status(500).json({ message: "Failed to update product" });
    }
  }

  // Delete product
  async deleteProduct(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const product = await this.productRepository.findOneBy({ id });
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Check ownership or admin status
      if (product.sellerId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to delete this product" });
      }

      await this.productRepository.remove(product);
      
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Delete product error:", error);
      res.status(500).json({ message: "Failed to delete product" });
    }
  }

  // Get products by seller
  async getSellerProducts(req: AuthRequest, res: Response) {
    try {
      const sellerId = req.params.sellerId || (req.user ? req.user.id : null);
      
      if (!sellerId) {
        return res.status(400).json({ message: "Seller ID is required" });
      }

      const products = await this.productRepository
        .createQueryBuilder("product")
        .leftJoinAndSelect("product.seller", "seller")
        .select([
          "product.id",
          "product.name",
          "product.description",
          "product.price",
          "product.image",
          "product.category",
          "product.sellerId",
          "seller.name",
          "product.createdAt",
          "product.updatedAt"
        ])
        .where("product.sellerId = :sellerId", { sellerId })
        .getMany();

      // Transform to match frontend model
      const transformedProducts = products.map(product => ({
        ...product,
        sellerName: product.seller.name
      }));

      res.json(transformedProducts);
    } catch (error) {
      console.error("Get seller products error:", error);
      res.status(500).json({ message: "Failed to get seller products" });
    }
  }
}
