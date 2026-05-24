"use client"
import { LoginInfluencer } from '@/app/actions/influencers'
import LoginForm from '@/components/ui/LoginForm'
import React from 'react'

const page = () => {
  return (
    <LoginForm
      onSubmit={async ({ email, password }) => {
        // wire up your auth here
       return await LoginInfluencer({
          email,
          password,
        });
        // console.log({ email, password });
      }}
      dashboardHref='/influencers'
      logoHref="/"
      registerHref="/influencers/auth/register"
      forgotPasswordHref="/forgot-password"
    />
  )
}

export default page