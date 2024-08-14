-- CreateTable
CREATE TABLE "LtiPlatform" (
    "id" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "issuer" TEXT NOT NULL,
    "jwksUri" TEXT NOT NULL,
    "authorizationEndpoint" TEXT NOT NULL,
    "registrationEndpoint" TEXT NOT NULL,
    "scopesSupported" TEXT[],
    "responseTypesSupported" TEXT[],
    "subjectTypesSupported" TEXT[],
    "idTokenSigningAlgValuesSupported" TEXT[],
    "claimsSupported" TEXT[],
    "productFamilyCode" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "variables" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LtiPlatform_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LtiClientRegistration" (
    "id" SERIAL NOT NULL,
    "clientId" TEXT NOT NULL,
    "responseTypes" TEXT[],
    "jwksUri" TEXT NOT NULL,
    "initiateLoginUri" TEXT NOT NULL,
    "grantTypes" TEXT[],
    "redirectUris" TEXT[],
    "applicationType" TEXT NOT NULL,
    "tokenEndpointAuthMethod" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "logoUri" TEXT,
    "scope" TEXT NOT NULL,
    "ltiToolConfiguration" JSONB NOT NULL,
    "ltiPlatformId" INTEGER NOT NULL,

    CONSTRAINT "LtiClientRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LtiPlatform_clientId_key" ON "LtiPlatform"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "LtiClientRegistration_clientId_key" ON "LtiClientRegistration"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "LtiClientRegistration_ltiPlatformId_key" ON "LtiClientRegistration"("ltiPlatformId");

-- AddForeignKey
ALTER TABLE "LtiClientRegistration" ADD CONSTRAINT "LtiClientRegistration_ltiPlatformId_fkey" FOREIGN KEY ("ltiPlatformId") REFERENCES "LtiPlatform"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
