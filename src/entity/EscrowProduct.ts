
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from "typeorm";
import { Escrow } from "./Escrow";
import { Product } from "./Product";

@Entity("escrow_products")
export class EscrowProduct {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Escrow, (escrow) => escrow.escrowProducts)
  @JoinColumn({ name: "escrowId" })
  escrow!: Escrow;

  @Column()
  escrowId!: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: "productId" })
  product!: Product;

  @Column()
  productId!: string;

  @Column("float")
  price!: number;

  @Column("int", { default: 1 })
  quantity!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
