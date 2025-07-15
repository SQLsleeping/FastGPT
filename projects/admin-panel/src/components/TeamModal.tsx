import React, { useEffect, useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
  Tabs,
  Table,
  Space,
  Popconfirm,
  Tag,
  Avatar,
  Typography,
} from 'antd'
import {
  UserOutlined,
  DeleteOutlined,
  PlusOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { teamApi, userApi } from '../services/api'
import type { Team, CreateTeamRequest, UpdateTeamRequest, TeamMember, User } from '../types'

const { Option } = Select
const { TextArea } = Input
const { TabPane } = Tabs
const { Text } = Typography

interface TeamModalProps {
  open: boolean
  onCancel: () => void
  team?: Team | null
  mode: 'create' | 'edit'
}

const TeamModal: React.FC<TeamModalProps> = ({
  open,
  onCancel,
  team,
  mode,
}) => {
  const [form] = Form.useForm()
  const [memberForm] = Form.useForm()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('basic')
  const [showAddMember, setShowAddMember] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)

  // 获取用户列表（用于选择团队所有者和添加成员）
  const { data: usersData } = useQuery({
    queryKey: ['users', { pageSize: 100 }],
    queryFn: () => userApi.getUsers({ page: 1, pageSize: 100 }),
    enabled: open,
  })

  // 获取团队成员列表（仅在编辑模式下）
  const { data: membersData, refetch: refetchMembers } = useQuery({
    queryKey: ['teamMembers', team?.id],
    queryFn: () => teamApi.getTeamMembers(team!.id),
    enabled: mode === 'edit' && !!team?.id && open,
  })

  // 创建团队
  const createMutation = useMutation({
    mutationFn: (data: CreateTeamRequest) => teamApi.createTeam(data),
    onSuccess: () => {
      message.success('团队创建成功')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      onCancel()
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '创建团队失败')
    },
  })

  // 更新团队
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamRequest }) =>
      teamApi.updateTeam(id, data),
    onSuccess: () => {
      message.success('团队信息更新成功')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      if (activeTab === 'basic') {
        onCancel()
      }
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '更新团队失败')
    },
  })

  // 添加团队成员
  const addMemberMutation = useMutation({
    mutationFn: ({ teamId, data }: { teamId: string; data: { userId: string; role: string } }) =>
      teamApi.addTeamMember(teamId, data),
    onSuccess: () => {
      message.success('成员添加成功')
      refetchMembers()
      setShowAddMember(false)
      memberForm.resetFields()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '添加成员失败')
    },
  })

  // 更新成员角色
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ teamId, memberId, role }: { teamId: string; memberId: string; role: string }) =>
      teamApi.updateMemberRole(teamId, memberId, { role }),
    onSuccess: () => {
      message.success('成员角色更新成功')
      refetchMembers()
      setEditingMember(null)
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '更新成员角色失败')
    },
  })

  // 移除团队成员
  const removeMemberMutation = useMutation({
    mutationFn: ({ teamId, memberId }: { teamId: string; memberId: string }) =>
      teamApi.removeTeamMember(teamId, memberId),
    onSuccess: () => {
      message.success('成员移除成功')
      refetchMembers()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '移除成员失败')
    },
  })

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (mode === 'create') {
        createMutation.mutate(values)
      } else if (team) {
        updateMutation.mutate({
          id: team.id,
          data: values,
        })
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 重置表单
  const handleCancel = () => {
    form.resetFields()
    memberForm.resetFields()
    setActiveTab('basic')
    setShowAddMember(false)
    setEditingMember(null)
    onCancel()
  }

  // 添加成员
  const handleAddMember = async () => {
    try {
      const values = await memberForm.validateFields()
      if (team) {
        addMemberMutation.mutate({
          teamId: team.id,
          data: values,
        })
      }
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }

  // 更新成员角色
  const handleUpdateMemberRole = (member: TeamMember, newRole: string) => {
    if (team) {
      updateMemberRoleMutation.mutate({
        teamId: team.id,
        memberId: member.id,
        role: newRole,
      })
    }
  }

  // 移除成员
  const handleRemoveMember = (member: TeamMember) => {
    if (team) {
      removeMemberMutation.mutate({
        teamId: team.id,
        memberId: member.id,
      })
    }
  }

  // 当团队数据变化时，更新表单
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && team) {
        form.setFieldsValue({
          name: team.name,
          description: team.description,
          status: team.status,
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, mode, team, form])

  const users = usersData?.data?.items || []
  const members = membersData?.data || []

  // 获取可添加的用户（排除已经是成员的用户）
  const availableUsers = users.filter(user =>
    !members.some(member => member.userId === user.id)
  )

  // 角色选项
  const roleOptions = [
    { label: '管理员', value: 'admin' },
    { label: '成员', value: 'member' },
  ]

  // 成员表格列配置
  const memberColumns = [
    {
      title: '用户',
      dataIndex: 'username',
      key: 'user',
      render: (username: string, record: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div>{username}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role: string, record: TeamMember) => (
        <Select
          value={role}
          style={{ width: 120 }}
          disabled={role === 'owner'}
          onChange={(newRole) => handleUpdateMemberRole(record, newRole)}
          loading={updateMemberRoleMutation.isPending}
        >
          <Option value="owner" disabled>所有者</Option>
          <Option value="admin">管理员</Option>
          <Option value="member">成员</Option>
        </Select>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status === 'active' ? '活跃' : status === 'pending' ? '待确认' : '暂停'}
        </Tag>
      ),
    },
    {
      title: '加入时间',
      dataIndex: 'joinedAt',
      key: 'joinedAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: TeamMember) => (
        <Space>
          {record.role !== 'owner' && (
            <Popconfirm
              title="确定要移除这个成员吗？"
              onConfirm={() => handleRemoveMember(record)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={removeMemberMutation.isPending}
              >
                移除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Modal
      title={mode === 'create' ? '新建团队' : '编辑团队'}
      open={open}
      onCancel={handleCancel}
      width={800}
      footer={
        activeTab === 'basic' ? [
          <Button key="cancel" onClick={handleCancel}>
            取消
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={createMutation.isPending || updateMutation.isPending}
            onClick={handleSubmit}
          >
            {mode === 'create' ? '创建' : '更新'}
          </Button>,
        ] : [
          <Button key="cancel" onClick={handleCancel}>
            关闭
          </Button>,
        ]
      }
      destroyOnClose
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'basic',
            label: '基本信息',
            children: (
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  status: 'active',
                }}
              >
        <Form.Item
          name="name"
          label="团队名称"
          rules={[
            { required: true, message: '请输入团队名称' },
            { min: 2, message: '团队名称至少2个字符' },
            { max: 50, message: '团队名称最多50个字符' },
          ]}
        >
          <Input placeholder="请输入团队名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label="团队描述"
          rules={[
            { max: 200, message: '团队描述最多200个字符' },
          ]}
        >
          <TextArea 
            placeholder="请输入团队描述" 
            rows={3}
            showCount
            maxLength={200}
          />
        </Form.Item>

        {mode === 'create' && (
          <Form.Item
            name="ownerId"
            label="团队所有者"
            rules={[{ required: true, message: '请选择团队所有者' }]}
          >
            <Select 
              placeholder="请选择团队所有者"
              showSearch
              filterOption={(input, option) =>
                (option?.children as unknown as string)
                  ?.toLowerCase()
                  ?.includes(input.toLowerCase())
              }
            >
              {users.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>
        )}

                {mode === 'edit' && (
                  <Form.Item
                    name="status"
                    label="状态"
                    rules={[{ required: true, message: '请选择状态' }]}
                  >
                    <Select placeholder="请选择状态">
                      <Option value="active">活跃</Option>
                      <Option value="inactive">未激活</Option>
                    </Select>
                  </Form.Item>
                )}
              </Form>
            ),
          },
          ...(mode === 'edit' ? [{
            key: 'members',
            label: '成员管理',
            children: (
              <div>
                <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text strong>团队成员 ({members.length})</Text>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setShowAddMember(true)}
                  >
                    添加成员
                  </Button>
                </div>

                <Table
                  columns={memberColumns}
                  dataSource={members}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />

                {/* 添加成员表单 */}
                {showAddMember && (
                  <div style={{ marginTop: 16, padding: 16, border: '1px solid #d9d9d9', borderRadius: 6 }}>
                    <Text strong>添加新成员</Text>
                    <Form
                      form={memberForm}
                      layout="inline"
                      style={{ marginTop: 12 }}
                    >
                      <Form.Item
                        name="userId"
                        rules={[{ required: true, message: '请选择用户' }]}
                      >
                        <Select
                          placeholder="选择用户"
                          style={{ width: 200 }}
                          showSearch
                          filterOption={(input, option) =>
                            (option?.children as unknown as string)
                              ?.toLowerCase()
                              ?.includes(input.toLowerCase())
                          }
                        >
                          {availableUsers.map(user => (
                            <Option key={user.id} value={user.id}>
                              {user.username} ({user.email})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        name="role"
                        rules={[{ required: true, message: '请选择角色' }]}
                        initialValue="member"
                      >
                        <Select placeholder="选择角色" style={{ width: 120 }}>
                          {roleOptions.map(option => (
                            <Option key={option.value} value={option.value}>
                              {option.label}
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item>
                        <Space>
                          <Button
                            type="primary"
                            onClick={handleAddMember}
                            loading={addMemberMutation.isPending}
                          >
                            添加
                          </Button>
                          <Button onClick={() => setShowAddMember(false)}>
                            取消
                          </Button>
                        </Space>
                      </Form.Item>
                    </Form>
                  </div>
                )}
              </div>
            ),
          }] : []),
        ]}
      />
    </Modal>
  )
}

export default TeamModal
