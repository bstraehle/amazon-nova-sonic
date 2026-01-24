import Link from 'next/link';

export default async function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center sm:px-6 lg:px-8">

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center">
            <p className="mb-6 text-center text-sm text-gray-600 dark:text-gray-300">
              DemoBank Voice Assistant (STS)
            </p>

            <Link
              href={`/api/auth/sign-in`}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1E5AA8] hover:bg-[#164785] dark:bg-[#1E5AA8] dark:hover:bg-[#164785] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1E5AA8] dark:focus:ring-offset-gray-800"
              prefetch={false} // prevent CORS error
            >
              Sign up / Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
