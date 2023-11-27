-- CreateTable
CREATE TABLE "Graph" (
    "id" SERIAL NOT NULL,
    "path" TEXT NOT NULL,
    "graph" TEXT NOT NULL,

    CONSTRAINT "Graph_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Graph_path_key" ON "Graph"("path");
