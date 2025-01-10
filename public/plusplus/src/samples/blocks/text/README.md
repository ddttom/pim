# text javascript

This code imports a function called `renderExpressions` from a JavaScript module located at "/plusplus/plugins/expressions/src/expressions.js". It then defines and exports a default function named `decorate` which takes a parameter called `block`.

Inside the `decorate` function, it selects an element with the class name 'text-wrapper' using `document.querySelector`. It then passes this selected element to the `renderExpressions` function, which presumably processes and renders expressions within that element.

In summary, this code snippet is responsible for decorating a specific block of content by rendering expressions within an element that has the class 'text-wrapper', utilizing the imported `renderExpressions` function from an external module.

This will just display text, but if any expressions are included it wil execute them

see <https://github.com/vtsaplin/franklin-expressions/>

Only one expression has been defined in clientExpressions.js {{expand,'$NAMESPACE:VARIABLE$}}

This one command expands the variable as text.

Create your own expressions in clientExpressions.js
