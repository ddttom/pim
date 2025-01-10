# bio block javascript

The `decorate` function takes a `block` parameter and performs the following steps:

First of all it checks for the class 'hide-author', if not found it performs the task below]

1. It searches for an `<img>` element within an element that has the class `.bio.block`.

2. If the `<img>` element is found and it has a non-empty `alt` attribute, the function extracts the author name from the `alt` attribute.

3. If the author name is not found in the `alt` attribute or if the `<img>` element doesn't exist, the function looks for a `<meta>` tag with the `name` attribute set to `"author"`. If found, it retrieves the author name from the `content` attribute of the `<meta>` tag.

4. The function then creates a new `<strong>` element and sets its text content to the author name.

5. Finally, the function locates the element with the class `.bio.block` and appends the newly created `<strong>` element containing the author name as the last child of the `.bio.block` element.

In essence, this part is responsible for extracting the author name from either the `alt` attribute of an image or the `content` attribute of a `<meta>` tag, and then adding the author name as a `<strong>` element to the end of the element with the class `.bio.block`; if not hidden.

The wrapper is added to the expressions resolver; it obeys the expression {{expand,$NAMESPACE:VARIABLE$})

It is assumed that the $system:enableprofilevariables$ has been set to 'y' and there are meaning profile variables
