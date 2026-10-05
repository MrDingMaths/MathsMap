import {repairFormulaAlignment,PROJECTS} from '../scripts/booklet/repair-formula-alignment-20261004.mjs';
import {registerRepairTests} from './helpers/layout-repair-20261004.mjs';
registerRepairTests('formula-alignment',repairFormulaAlignment,PROJECTS);
