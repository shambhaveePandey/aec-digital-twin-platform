-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "passwordHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "invitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "digital_twins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "digital_twins_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "twin_model_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "twinId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "ifcFileKey" TEXT,
    "ifcFileName" TEXT,
    "ifcFileSizeBytes" INTEGER,
    "fragFileKey" TEXT,
    "fragFileSizeBytes" INTEGER,
    "elementCount" INTEGER,
    "ifcSchema" TEXT,
    "boundingBox" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "twin_model_versions_twinId_fkey" FOREIGN KEY ("twinId") REFERENCES "digital_twins" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "twin_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "twinId" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "s3Key" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "mimeType" TEXT,
    "checksum" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,
    CONSTRAINT "twin_files_twinId_fkey" FOREIGN KEY ("twinId") REFERENCES "digital_twins" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "element_property_cache" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelVersionId" TEXT NOT NULL,
    "ifcGuid" TEXT NOT NULL,
    "expressId" INTEGER NOT NULL,
    "ifcClass" TEXT NOT NULL,
    "name" TEXT,
    "propertySets" TEXT NOT NULL,
    "classifications" TEXT,
    "spatialPath" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "element_property_cache_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "twin_model_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sensors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "twinId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT,
    "ifcGuid" TEXT,
    "expressId" INTEGER,
    "mqttTopic" TEXT,
    "externalId" TEXT,
    "thresholdMin" REAL,
    "thresholdMax" REAL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSeenAt" DATETIME,
    "lastValue" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sensors_twinId_fkey" FOREIGN KEY ("twinId") REFERENCES "digital_twins" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sensor_readings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sensorId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "unit" TEXT,
    "quality" INTEGER,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sensor_readings_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "sensors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "issues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "twinId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigneeId" TEXT,
    "reportedById" TEXT,
    "ifcGuid" TEXT,
    "expressId" INTEGER,
    "bcfGuid" TEXT,
    "dueDate" DATETIME,
    "closedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "issues_twinId_fkey" FOREIGN KEY ("twinId") REFERENCES "digital_twins" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "issue_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueId" TEXT NOT NULL,
    "authorId" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "issue_comments_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "viewpoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "twinId" TEXT NOT NULL,
    "issueId" TEXT,
    "label" TEXT,
    "cameraPosition" TEXT NOT NULL,
    "cameraTarget" TEXT NOT NULL,
    "cameraUp" TEXT NOT NULL,
    "isOrthographic" BOOLEAN NOT NULL DEFAULT false,
    "orthographicSize" REAL,
    "hiddenGuids" TEXT,
    "selectedGuids" TEXT,
    "bcfGuid" TEXT,
    "snapshotKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "viewpoints_twinId_fkey" FOREIGN KEY ("twinId") REFERENCES "digital_twins" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "viewpoints_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "issues" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT,
    "twinId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_events_twinId_fkey" FOREIGN KEY ("twinId") REFERENCES "digital_twins" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "audit_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "background_jobs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "twinId" TEXT,
    "modelVersionId" TEXT,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "payload" TEXT,
    "result" TEXT,
    "errorMessage" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "workerId" TEXT,
    "scheduledAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "background_jobs_twinId_fkey" FOREIGN KEY ("twinId") REFERENCES "digital_twins" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "background_jobs_modelVersionId_fkey" FOREIGN KEY ("modelVersionId") REFERENCES "twin_model_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");

-- CreateIndex
CREATE INDEX "workspace_members_workspaceId_idx" ON "workspace_members"("workspaceId");

-- CreateIndex
CREATE INDEX "workspace_members_userId_idx" ON "workspace_members"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "digital_twins_workspaceId_idx" ON "digital_twins"("workspaceId");

-- CreateIndex
CREATE INDEX "digital_twins_status_idx" ON "digital_twins"("status");

-- CreateIndex
CREATE INDEX "twin_model_versions_twinId_idx" ON "twin_model_versions"("twinId");

-- CreateIndex
CREATE INDEX "twin_model_versions_status_idx" ON "twin_model_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "twin_model_versions_twinId_version_key" ON "twin_model_versions"("twinId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "twin_files_s3Key_key" ON "twin_files"("s3Key");

-- CreateIndex
CREATE INDEX "twin_files_twinId_idx" ON "twin_files"("twinId");

-- CreateIndex
CREATE INDEX "twin_files_fileType_idx" ON "twin_files"("fileType");

-- CreateIndex
CREATE INDEX "element_property_cache_modelVersionId_idx" ON "element_property_cache"("modelVersionId");

-- CreateIndex
CREATE INDEX "element_property_cache_modelVersionId_ifcClass_idx" ON "element_property_cache"("modelVersionId", "ifcClass");

-- CreateIndex
CREATE INDEX "element_property_cache_ifcGuid_idx" ON "element_property_cache"("ifcGuid");

-- CreateIndex
CREATE UNIQUE INDEX "element_property_cache_modelVersionId_ifcGuid_key" ON "element_property_cache"("modelVersionId", "ifcGuid");

-- CreateIndex
CREATE INDEX "sensors_twinId_idx" ON "sensors"("twinId");

-- CreateIndex
CREATE INDEX "sensors_mqttTopic_idx" ON "sensors"("mqttTopic");

-- CreateIndex
CREATE INDEX "sensors_ifcGuid_idx" ON "sensors"("ifcGuid");

-- CreateIndex
CREATE INDEX "sensor_readings_sensorId_timestamp_idx" ON "sensor_readings"("sensorId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "issues_bcfGuid_key" ON "issues"("bcfGuid");

-- CreateIndex
CREATE INDEX "issues_twinId_idx" ON "issues"("twinId");

-- CreateIndex
CREATE INDEX "issues_twinId_status_idx" ON "issues"("twinId", "status");

-- CreateIndex
CREATE INDEX "issues_assigneeId_idx" ON "issues"("assigneeId");

-- CreateIndex
CREATE INDEX "issue_comments_issueId_idx" ON "issue_comments"("issueId");

-- CreateIndex
CREATE UNIQUE INDEX "viewpoints_bcfGuid_key" ON "viewpoints"("bcfGuid");

-- CreateIndex
CREATE INDEX "viewpoints_twinId_idx" ON "viewpoints"("twinId");

-- CreateIndex
CREATE INDEX "viewpoints_issueId_idx" ON "viewpoints"("issueId");

-- CreateIndex
CREATE INDEX "audit_events_workspaceId_idx" ON "audit_events"("workspaceId");

-- CreateIndex
CREATE INDEX "audit_events_twinId_idx" ON "audit_events"("twinId");

-- CreateIndex
CREATE INDEX "audit_events_userId_idx" ON "audit_events"("userId");

-- CreateIndex
CREATE INDEX "audit_events_createdAt_idx" ON "audit_events"("createdAt");

-- CreateIndex
CREATE INDEX "background_jobs_status_idx" ON "background_jobs"("status");

-- CreateIndex
CREATE INDEX "background_jobs_twinId_idx" ON "background_jobs"("twinId");

-- CreateIndex
CREATE INDEX "background_jobs_type_status_idx" ON "background_jobs"("type", "status");

-- CreateIndex
CREATE INDEX "background_jobs_scheduledAt_idx" ON "background_jobs"("scheduledAt");
