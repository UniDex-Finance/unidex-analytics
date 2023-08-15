/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontFamily: {
				header: ['Bebas Neue', ...require('tailwindcss/defaultTheme').fontFamily.sans],
			}
		},
	},
	plugins: [require('daisyui')],
}
