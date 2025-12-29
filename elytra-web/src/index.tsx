import { render } from 'preact';
import { App } from './App'

import './style.css';
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react';

const system = createSystem(defaultConfig, {
	theme: {
		tokens: {
			 colors: {
				brand: {
					50: {value: "hsla(260, 100%, 98%, 1.00)"},
					100: {value: "hsla(260, 100%, 96%, 1.00)"},
					200: {value: "hsla(260, 100%, 92%, 1.00)"},
					300: {value: "hsla(260, 97%, 85%, 1.00)"},
					400: {value: "hsla(260, 95%, 75%, 1.00)"},
					500: {value: "hsla(260, 91%, 65%, 1.00)"},
					600: {value: "hsla(260, 81%, 56%, 1.00)"},
					700: {value: "hsla(260, 72%, 37%, 1.00)"},
					800: {value: "hsla(260, 66%, 27%, 1.00)"},
					900: {value: "hsla(259, 89%, 17%, 1.00)"},
					950: {value: "hsla(260, 88%, 10%, 1.00)"},
				}
			}
		},
		semanticTokens: {
			colors: {
				brand: {
					solid: { value: "{colors.brand.800}" },
					contrast: { value: "{colors.brand.100}" },
					fg: { value: "{colors.brand.700}" },
					muted: { value: "{colors.brand.100}" },
					subtle: { value: "{colors.brand.200}" },
					emphasized: { value: "{colors.brand.300}" },
					focusRing: { value: "{colors.brand.500}" },
				},
			},
		},
	}
});


render(


	<ChakraProvider value={system}>
		{/* <ColorModeProvider> */}
		<App />
		{/* </ColorModeProvider> */}
	</ChakraProvider>

	, document.getElementById('app'));
