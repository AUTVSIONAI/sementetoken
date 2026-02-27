import Link from "next/link"

export default function CancelPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-red-50 p-4 text-center">
      <h1 className="mb-4 text-3xl font-bold text-red-700">Pagamento Cancelado</h1>
      <p className="mb-8 text-lg text-gray-700">
        Você cancelou o pagamento. Nenhum valor foi cobrado.
      </p>
      <Link
        href="/dashboard"
        className="rounded bg-gray-600 px-6 py-3 font-semibold text-white hover:bg-gray-700"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  )
}
