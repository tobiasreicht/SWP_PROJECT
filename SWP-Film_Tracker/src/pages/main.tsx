import React from 'react'
import Test from '../components/test'

export default function Main(): JSX.Element {
	return (
		<main className="min-h-screen bg-slate-50 p-8">
			<div className="max-w-4xl mx-auto">
				<h1 className="text-3xl font-bold text-sky-700 mb-6">Main Page</h1>
				<Test />
			</div>
		</main>
	)
}

