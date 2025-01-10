/* eslint-disable import/no-absolute-path */
/* eslint-disable no-unused-vars */
/* eslint-disable import/no-unresolved */
import { renderExpressions } from '/plusplus/plugins/expressions/src/expressions.js';

export default function decorate(block) {
  renderExpressions(document.querySelector('.text-wrapper'));
}
