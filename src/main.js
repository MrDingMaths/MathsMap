import { mount } from 'svelte';
import 'katex/dist/katex.min.css';
import './app.css';
import App from './App.svelte';
import {BOOKLET_PALETTE} from '../public/libs/maths-editor/booklet-palette.mjs';
for(const [role,colour] of Object.entries(BOOKLET_PALETTE))document.documentElement.style.setProperty('--booklet-'+role,colour);

export default mount(App, { target: document.getElementById('app') });
