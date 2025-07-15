import React, { useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Button,
  message,
} from 'antd'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { userApi } from '../services/api'
import type { User, CreateUserRequest, UpdateUserRequest } from '../types'

const { Option } = Select

interface UserModalProps {
  open: boolean
  onCancel: () => void
  user?: User | null
  mode: 'create' | 'edit'
}

const UserModal: React.FC<UserModalProps> = ({
  open,
  onCancel,
  user,
  mode,
}) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  // 创建用户
  const createMutation = useMutation({
    mutationFn: (data: CreateUserRequest) => userApi.createUser(data),
    onSuccess: () => {
      message.success('用户创建成功')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onCancel()
      form.resetFields()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '创建用户失败')
    },
  })

  // 更新用户
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      userApi.updateUser(id, data),
    onSuccess: () => {
      message.success('用户信息更新成功')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onCancel()
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || '更新用户失败')
    },
  })

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      if (mode === 'create') {
        createMutation.mutate(values)
      } else if (user) {
        updateMutation.mutate({
          id: user.id,
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
    onCancel()
  }

  // 当用户数据变化时，更新表单
  useEffect(() => {
    if (open) {
      if (mode === 'edit' && user) {
        form.setFieldsValue({
          username: user.username,
          email: user.email,
          status: user.status,
          role: user.role,
        })
      } else {
        form.resetFields()
      }
    }
  }, [open, mode, user, form])

  return (
    <Modal
      title={mode === 'create' ? '新建用户' : '编辑用户'}
      open={open}
      onCancel={handleCancel}
      footer={[
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
      ]}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: 'active',
          role: 'user',
        }}
      >
        <Form.Item
          name="username"
          label="用户名"
          rules={[
            { required: true, message: '请输入用户名' },
            { min: 3, message: '用户名至少3个字符' },
            { max: 20, message: '用户名最多20个字符' },
          ]}
        >
          <Input placeholder="请输入用户名" />
        </Form.Item>

        <Form.Item
          name="email"
          label="邮箱"
          rules={[
            { required: true, message: '请输入邮箱' },
            { type: 'email', message: '请输入有效的邮箱地址' },
          ]}
        >
          <Input placeholder="请输入邮箱" />
        </Form.Item>

        {mode === 'create' && (
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, message: '密码至少6个字符' },
            ]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
        )}

        <Form.Item
          name="role"
          label="角色"
          rules={[{ required: true, message: '请选择角色' }]}
        >
          <Select placeholder="请选择角色">
            <Option value="user">普通用户</Option>
            <Option value="admin">管理员</Option>
            <Option value="super_admin">超级管理员</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select placeholder="请选择状态">
            <Option value="active">正常</Option>
            <Option value="inactive">未激活</Option>
            <Option value="suspended">已停用</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default UserModal
