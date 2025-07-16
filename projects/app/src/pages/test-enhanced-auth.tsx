import React, { useState } from 'react';
import { Box, Button, Input, VStack, Text, useToast, Heading, Divider } from '@chakra-ui/react';

/**
 * 测试增强版认证功能的页面
 */
export default function TestEnhancedAuth() {
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const toast = useToast();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/support/user/account/loginByPasswordEnhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginForm),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: '登录成功',
          description: `欢迎回来，${data.data.user.username}！`,
          status: 'success',
          duration: 3000,
        });
      } else {
        toast({
          title: '登录失败',
          description: data.message || data.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: '登录错误',
        description: '网络错误，请稍后重试',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/support/user/account/registerEnhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerForm),
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        toast({
          title: '注册成功',
          description: `用户 ${data.data.user.username} 注册成功！`,
          status: 'success',
          duration: 3000,
        });
      } else {
        toast({
          title: '注册失败',
          description: data.message || data.error,
          status: 'error',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Register error:', error);
      toast({
        title: '注册错误',
        description: '网络错误，请稍后重试',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const testUserManagementService = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/health');
      const data = await response.json();
      setResult(data);
      
      toast({
        title: '服务状态检查',
        description: `用户管理服务状态：${data.status}`,
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Service test error:', error);
      toast({
        title: '服务检查失败',
        description: '用户管理服务不可用',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="800px" mx="auto" p={6}>
      <Heading mb={6} textAlign="center">
        FastGPT 增强版认证功能测试
      </Heading>

      <VStack spacing={8} align="stretch">
        {/* 服务状态检查 */}
        <Box>
          <Heading size="md" mb={4}>服务状态检查</Heading>
          <Button onClick={testUserManagementService} isLoading={loading} colorScheme="blue">
            检查用户管理服务状态
          </Button>
        </Box>

        <Divider />

        {/* 登录测试 */}
        <Box>
          <Heading size="md" mb={4}>登录测试</Heading>
          <VStack spacing={3}>
            <Input
              placeholder="用户名"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
            />
            <Input
              placeholder="密码"
              type="password"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
            />
            <Button onClick={handleLogin} isLoading={loading} colorScheme="green" w="full">
              登录
            </Button>
            <Text fontSize="sm" color="gray.500">
              测试账号：testuser2 / password123
            </Text>
          </VStack>
        </Box>

        <Divider />

        {/* 注册测试 */}
        <Box>
          <Heading size="md" mb={4}>注册测试</Heading>
          <VStack spacing={3}>
            <Input
              placeholder="用户名"
              value={registerForm.username}
              onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
            />
            <Input
              placeholder="邮箱"
              type="email"
              value={registerForm.email}
              onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
            />
            <Input
              placeholder="密码"
              type="password"
              value={registerForm.password}
              onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
            />
            <Input
              placeholder="确认密码"
              type="password"
              value={registerForm.confirmPassword}
              onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
            />
            <Button onClick={handleRegister} isLoading={loading} colorScheme="purple" w="full">
              注册
            </Button>
          </VStack>
        </Box>

        <Divider />

        {/* 结果显示 */}
        {result && (
          <Box>
            <Heading size="md" mb={4}>API 响应结果</Heading>
            <Box
              p={4}
              bg="gray.50"
              borderRadius="md"
              border="1px"
              borderColor="gray.200"
              maxH="400px"
              overflowY="auto"
            >
              <Text as="pre" fontSize="sm" whiteSpace="pre-wrap">
                {JSON.stringify(result, null, 2)}
              </Text>
            </Box>
          </Box>
        )}
      </VStack>
    </Box>
  );
}
