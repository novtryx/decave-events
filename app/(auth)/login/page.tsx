"use client"
import { loginUser } from '@/app/actions/auth';
import LoginForm from '@/components/ui/LoginForm';
import React from 'react'

const page = () => {
  return (
    <LoginForm
      onSubmit={async ({ email, password }) => {
        // wire up your auth here
        await loginUser({
          email,
          password,
        });
        // console.log({ email, password });
      }}
      logoHref="/"
      registerHref="/register"
      forgotPasswordHref="/forgot-password"
    />
  )
}

export default page