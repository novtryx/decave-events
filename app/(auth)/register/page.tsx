"use client"
import { RegisterUser } from '@/app/actions/auth';
import RegisterForm from '@/components/ui/RegisterForm'
import React from 'react'

const page = () => {
  return (
    <RegisterForm
      onSubmit={async ({ email, password, name, businessName, address }) => {
              // wire up your auth here
              await RegisterUser({
                email,
                password,
                name,
                businessName,
                address
              });
              console.log({ email, password });
            }}
    />
  )
}

export default page