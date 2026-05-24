import React from 'react'
import InfluencerPage from './Home'
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const page = async() => {
  const ACCESS_TOKEN_KEY_2 = "accessToken2"

    const token = (await cookies()).get(ACCESS_TOKEN_KEY_2)?.value;

  if (!token) {
    redirect("/influencers/auth/login");
  }
  return (
    <InfluencerPage/>
  )
}

export default page