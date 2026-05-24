"use client"
import React from 'react'
import RegisterForm from './RegisterForm';
import { RegisterInfluencer } from '@/app/actions/influencers';

const page = () => {
  return (
     <RegisterForm
     loginHref='/influencers/auth/login'
      onSubmit={async ({ email, password, username, fullName  }) => {
            //   // wire up your auth here
             return await RegisterInfluencer({
                email,
                password,
                fullName,
                username,
              });
            }}
    />
  )
}

export default page