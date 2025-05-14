
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn
} from "typeorm";
import { User } from "./User";
import { EscrowProduct } from "./EscrowProduct";
import { Dispute } from "./Dispute";

export enum TransactionStatus {
  PENDING = "pending",
  AWAITING_DELIVERY = "awaiting_delivery",
  DELIVERED = "delivered",
  COMPLETED = "completed",
  DISPUTED = "disputed",
  REFUNDED = "refunded",
  CANCELED = "canceled",
  EXPIRED = "expired"  // Added new status for expired escrows
}

@Entity("escrows")
export class Escrow {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @OneToMany(() => EscrowProduct, (escrowProduct) => escrowProduct.escrow, { 
    cascade: true 
  })
  escrowProducts!: EscrowProduct[];

  @Column("float")
  amount!: number;

  @ManyToOne(() => User, (user) => user.buyerEscrows)
  @JoinColumn({ name: "buyerId" })
  buyer!: User;

  @Column()
  buyerId!: string;

  @ManyToOne(() => User, (user) => user.sellerEscrows)
  @JoinColumn({ name: "sellerId" })
  seller!: User;

  @Column()
  sellerId!: string;

  @Column({
    type: "simple-enum",
    enum: TransactionStatus,
    default: TransactionStatus.AWAITING_DELIVERY
  })
  status!: TransactionStatus;

  @Column({ nullable: true })
  expiryDate!: Date;

  @OneToMany(() => Dispute, (dispute) => dispute.escrow)
  disputes!: Dispute[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Method to check if escrow is expired
  isExpired(): boolean {
    if (!this.expiryDate) return false;
    return new Date() > this.expiryDate;
  }
}
