import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn
} from "typeorm"

@Entity("seme_transactions")
export class SemeTransaction {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ name: "wallet_address", type: "varchar", length: 255 })
  walletAddress: string

  @Column({ name: "amount_seme", type: "numeric", precision: 78, scale: 18 })
  amountSeme: string

  @Column({ name: "trees_equivalent", type: "int" })
  treesEquivalent: number

  @Column({ name: "tx_hash", type: "varchar", length: 255 })
  txHash: string

  @Column({ name: "block_number", type: "int", nullable: true })
  blockNumber: number

  @Column({ type: "varchar", length: 20 })
  status: string

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}

