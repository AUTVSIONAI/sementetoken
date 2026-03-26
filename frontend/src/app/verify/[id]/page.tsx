import { redirect } from "next/navigation"

export default function VerifyRedirectPage({ params }: { params: { id: string } }) {
  redirect(`/tree/${params.id}`)
}

