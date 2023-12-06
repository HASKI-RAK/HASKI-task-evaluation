-- CreateTable
CREATE TABLE "Settings" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "modelUrl" TEXT NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_path_key" ON "Settings"("path");
