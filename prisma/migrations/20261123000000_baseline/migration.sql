-- Baseline skema v3. DB produksi lama ditandai applied (migrate resolve), bukan dijalankan.
-- CHECK constraint ditulis manual karena Prisma tidak mendukungnya.
-- CreateTable
CREATE TABLE "users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "salt" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "sessions" (
    "token" TEXT NOT NULL PRIMARY KEY,
    "user_id" INTEGER NOT NULL,
    "expires" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "kos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "memberships" (
    "user_id" INTEGER NOT NULL,
    "kos_id" INTEGER NOT NULL,

    PRIMARY KEY ("user_id", "kos_id"),
    CONSTRAINT "memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "memberships_kos_id_fkey" FOREIGN KEY ("kos_id") REFERENCES "kos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "room_types" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kos_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "base_price" INTEGER NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "archived" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "room_types_kos_id_fkey" FOREIGN KEY ("kos_id") REFERENCES "kos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "room_types_chk1" CHECK ("base_price" >= 0),
    CONSTRAINT "room_types_chk2" CHECK ("capacity" >= 1)
);

-- CreateTable
CREATE TABLE "rooms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kos_id" INTEGER NOT NULL,
    "number" TEXT NOT NULL,
    "room_type_id" INTEGER NOT NULL,
    "price_override" INTEGER,
    "archived" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "rooms_kos_id_fkey" FOREIGN KEY ("kos_id") REFERENCES "kos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rooms_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "rooms_chk1" CHECK ("price_override" IS NULL OR "price_override" >= 0)
);

-- CreateTable
CREATE TABLE "promos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "room_type_id" INTEGER,
    "price" INTEGER NOT NULL,
    "start_date" TEXT NOT NULL,
    "end_date" TEXT NOT NULL,
    "kos_id" INTEGER NOT NULL,
    CONSTRAINT "promos_room_type_id_fkey" FOREIGN KEY ("room_type_id") REFERENCES "room_types" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "promos_kos_id_fkey" FOREIGN KEY ("kos_id") REFERENCES "kos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "promos_chk1" CHECK ("price" >= 0),
    CONSTRAINT "promos_chk2" CHECK ("end_date" >= "start_date")
);

-- CreateTable
CREATE TABLE "guests" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "note" TEXT,
    "kos_id" INTEGER NOT NULL,
    CONSTRAINT "guests_kos_id_fkey" FOREIGN KEY ("kos_id") REFERENCES "kos" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bookings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "room_id" INTEGER NOT NULL,
    "guest_id" INTEGER NOT NULL,
    "promo_id" INTEGER,
    "check_in" TEXT NOT NULL,
    "check_out" TEXT NOT NULL,
    "price_total" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'booked',
    "note" TEXT,
    "deposit" INTEGER NOT NULL DEFAULT 0,
    "deposit_paid_date" TEXT,
    "deposit_returned_date" TEXT,
    "kos_id" INTEGER NOT NULL,
    CONSTRAINT "bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookings_promo_id_fkey" FOREIGN KEY ("promo_id") REFERENCES "promos" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "bookings_kos_id_fkey" FOREIGN KEY ("kos_id") REFERENCES "kos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bookings_chk1" CHECK ("price_total" >= 0),
    CONSTRAINT "bookings_chk2" CHECK ("status" IN ('booked','checked_in','checked_out','cancelled')),
    CONSTRAINT "bookings_chk3" CHECK ("deposit" >= 0),
    CONSTRAINT "bookings_chk4" CHECK ("check_out" > "check_in")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "kos_id" INTEGER NOT NULL,
    "kind" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "categories_kos_id_fkey" FOREIGN KEY ("kos_id") REFERENCES "kos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "categories_chk1" CHECK ("kind" IN ('income','expense','capital'))
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category_id" INTEGER NOT NULL,
    "booking_id" INTEGER,
    "room_id" INTEGER,
    "date" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT,
    "note" TEXT,
    "kos_id" INTEGER NOT NULL,
    CONSTRAINT "transactions_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "bookings" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "rooms" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_kos_id_fkey" FOREIGN KEY ("kos_id") REFERENCES "kos" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "transactions_chk1" CHECK ("amount" > 0)
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "idx_mem_kos" ON "memberships"("kos_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_types_kos_id_name_key" ON "room_types"("kos_id", "name");

-- CreateIndex
CREATE INDEX "idx_rooms_kos" ON "rooms"("kos_id");

-- CreateIndex
CREATE UNIQUE INDEX "rooms_kos_id_number_key" ON "rooms"("kos_id", "number");

-- CreateIndex
CREATE INDEX "idx_bookings_room" ON "bookings"("room_id", "check_in");

-- CreateIndex
CREATE INDEX "idx_bookings_kos" ON "bookings"("kos_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_kos_id_kind_name_key" ON "categories"("kos_id", "kind", "name");

-- CreateIndex
CREATE INDEX "idx_tx_date" ON "transactions"("date");

-- CreateIndex
CREATE INDEX "idx_tx_booking" ON "transactions"("booking_id");

-- CreateIndex
CREATE INDEX "idx_tx_kos" ON "transactions"("kos_id", "date");

