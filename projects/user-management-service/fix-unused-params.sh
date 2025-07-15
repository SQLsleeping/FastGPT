#!/bin/bash

# 批量修正未使用的参数
# 将参数名前加下划线表示未使用

# 修正audit.model.ts
sed -i 's/data: CreateAuditLogData/_data: CreateAuditLogData/g' src/models/audit.model.ts
sed -i 's/data: CreateAuditLogData\[\]/_data: CreateAuditLogData[]/g' src/models/audit.model.ts
sed -i 's/id: string/_id: string/g' src/models/audit.model.ts
sed -i 's/query: AuditLogQuery/_query: AuditLogQuery/g' src/models/audit.model.ts
sed -i 's/page = 1/_page = 1/g' src/models/audit.model.ts
sed -i 's/limit = 50/_limit = 50/g' src/models/audit.model.ts
sed -i 's/userId: string/_userId: string/g' src/models/audit.model.ts
sed -i 's/enterpriseId: string/_enterpriseId: string/g' src/models/audit.model.ts
sed -i 's/resourceType: ResourceType/_resourceType: ResourceType/g' src/models/audit.model.ts
sed -i 's/resourceId: string/_resourceId: string/g' src/models/audit.model.ts
sed -i 's/retentionDays: number/_retentionDays: number/g' src/models/audit.model.ts
sed -i 's/format: '\''csv'\'' | '\''json'\'' | '\''xlsx'\''/_format: '\''csv'\'' | '\''json'\'' | '\''xlsx'\''/g' src/models/audit.model.ts
sed -i 's/resourceType: ResourceType, result/_resourceType: ResourceType, result/g' src/models/audit.model.ts

# 修正department.model.ts
sed -i 's/Department } from/@types/Department } from/g' src/models/department.model.ts
sed -i 's/data: CreateDepartmentData/_data: CreateDepartmentData/g' src/models/department.model.ts
sed -i 's/data: UpdateDepartmentData/_data: UpdateDepartmentData/g' src/models/department.model.ts
sed -i 's/departmentId: string/_departmentId: string/g' src/models/department.model.ts
sed -i 's/parentId: string/_parentId: string/g' src/models/department.model.ts
sed -i 's/newParentId?: string/_newParentId?: string/g' src/models/department.model.ts
sed -i 's/newParentId: string/_newParentId: string/g' src/models/department.model.ts
sed -i 's/name: string/_name: string/g' src/models/department.model.ts
sed -i 's/excludeId?: string/_excludeId?: string/g' src/models/department.model.ts
sed -i 's/query: DepartmentQuery/_query: DepartmentQuery/g' src/models/department.model.ts

# 修正role.model.ts
sed -i 's/Role, PermissionRule/PermissionRule/g' src/models/role.model.ts
sed -i 's/data: CreateRoleData/_data: CreateRoleData/g' src/models/role.model.ts
sed -i 's/data: UpdateRoleData/_data: UpdateRoleData/g' src/models/role.model.ts
sed -i 's/name: string/_name: string/g' src/models/role.model.ts
sed -i 's/roleId: string/_roleId: string/g' src/models/role.model.ts
sed -i 's/permission: PermissionRule/_permission: PermissionRule/g' src/models/role.model.ts
sed -i 's/permissionId: string/_permissionId: string/g' src/models/role.model.ts
sed -i 's/action: PermissionAction/_action: PermissionAction/g' src/models/role.model.ts
sed -i 's/resourceId?: string/_resourceId?: string/g' src/models/role.model.ts
sed -i 's/query: RoleQuery/_query: RoleQuery/g' src/models/role.model.ts
sed -i 's/inheritFromIds: string\[\]/_inheritFromIds: string[]/g' src/models/role.model.ts

echo "修正完成"
