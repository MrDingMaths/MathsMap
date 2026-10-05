import {repairDuplicateWorkedDiagram,PROJECTS} from '../scripts/booklet/repair-duplicate-worked-diagram-20261004.mjs';
import {registerRepairTests} from './helpers/layout-repair-20261004.mjs';
registerRepairTests('duplicate-worked-diagram',repairDuplicateWorkedDiagram,PROJECTS);
