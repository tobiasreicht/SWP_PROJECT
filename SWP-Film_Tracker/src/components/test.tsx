import React, { useState } from 'react'

export default function Test(): JSX.Element {
	const [count, setCount] = useState(0)

	return (
		<section className="p-6 bg-gradient-to-r from-sky-50 to-white rounded-lg shadow-md max-w-md mx-auto">
			<h2 className="text-2xl font-semibold text-sky-700 mb-2">Tailwind Test Component</h2>
			<p className="text-gray-600 mb-4">A small interactive example using Tailwind CSS.</p>

			<div className="flex items-center gap-3">
				<button
					onClick={() => setCount((c) => c + 1)}
					className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 transition"
				>
					Click me
				</button>

				<span className="text-gray-800">Clicked <strong className="text-sky-600">{count}</strong> times</span>
			</div>
		</section>
	)
}

