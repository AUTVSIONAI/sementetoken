import Link from "next/link"

export default function SuccessPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-green-50 p-4 text-center">
      <h1 className="mb-4 text-3xl font-bold text-green-700">Pagamento Confirmado!</h1>
      <p className="mb-8 text-lg text-gray-700">
        Obrigado por sua compra. Seus tokens SEME serão creditados em breve.
      </p>
      <Link
        href="/dashboard"
        className="rounded bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700"
      >
        Voltar ao Dashboard
      </Link>
    </div>
  )
}
