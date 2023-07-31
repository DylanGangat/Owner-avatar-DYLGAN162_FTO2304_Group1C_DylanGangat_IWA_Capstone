import { BOOKS_PER_PAGE, css, books, authors } from "./data.js";
import { html, createPreview } from "./view.js";

let matches = books;
let page = 1;
const range = [0, BOOKS_PER_PAGE];

if (!books && !Array.isArray(books)) throw new Error("Source required");
if (!range && range.length < 2) throw new Error("Range must be an array with two numbers");

/**
 * Updates the "Show more" button with the correct text and state based on the current page and book data.
 * The function calculates the number of remaining books based on the current page and books per page,
 * and then updates the button's text content and disabled state accordingly.
 *
 */

const updateRemainingButton = () => {
  const remainingBooksCount = matches.length - page * BOOKS_PER_PAGE;
  const remainingBooksDisplay = remainingBooksCount > 0 ? remainingBooksCount : 0;
  // Set the text content of the button to display the total number of books and "Show more".
  html.list.button.innerText = `Show more (${matches.length - BOOKS_PER_PAGE})`;
  // Disable the button if there are no remaining books to show.
  html.list.button.disabled = !(remainingBooksCount > 0);
  html.list.button.innerHTML = /* html */ `
  <span>Show more</span>
  <span class="list__remaining"> (${remainingBooksDisplay})</span>
`;
};

/**
 * Creates a document fragment containing a list of book previews based on the provided matches array,
 * starting from the specified startIndex up to the endIndex or until the end of the matches array.
 *
 * @param {Array} matches - The array of book objects to create previews.
 * @param {number} [startIndex=range[0]] - The index to start creating previews. Default is the first index of the range array.
 * @param {number} [endIndex=range[1]] - The index to stop creating previews at. Default is the second index of the range array.
 * @returns {DocumentFragment} The document fragment containing the book previews.
 */

const createPreviewsFragment = (matches, startIndex = range[0], endIndex = range[1]) => {
  const fragment = document.createDocumentFragment();
  // If startIndex can't add another 36 book preview the next time it's called,
  // this ensures that the remaining book previews are added from the "matches" array.
  if (startIndex + 36 > matches.length) {
    startIndex -= 36;
    endIndex = matches.length;
  }

  const extractedBooks = matches.slice(startIndex, endIndex);

  //  Loops through the extractedBooks Array and creates a list of book previews and appends them to the HTML document.
  for (const book of extractedBooks) {
    const preview = createPreview(book);
    fragment.appendChild(preview);
  }
  updateRemainingButton();

  return fragment;
};

html.list.items.appendChild(createPreviewsFragment(matches));

/**
 * Function to handle the search button click event and open the search overlay
 */
const handleSearchButtonClick = () => {
  html.search.overlay.open = true;
  html.search.title.focus();
};

/**
 *  Function to handle the search cancel button click event and close the search overlay
 */
const handleSearchCancelClick = () => {
  html.search.overlay.open = false;
  html.search.form.reset();
};

/**
 * Function to handle the settings button click event and open the settings overlay
 */
const handleSettingsButtonClick = () => {
  html.settings.overlay.open = true;
};

/**
 * Function to handle the settings cancel button click event and close the settings overlay
 */
const handleSettingsCancelClick = () => {
  html.settings.overlay.open = false;
};

/**
 * Function to handle the list close button click event and close the book preview overlay
 */
const handleBookPreviewCloseClick = () => {
  html.list.overlay.open = false;
};

/**
 * Function that increases the current page number, appends new book previews to the list, and updates the "Show more" button.
 */
const handleListButtonClick = () => {
  page = page + 1;
  html.list.items.appendChild(createPreviewsFragment(matches, page * BOOKS_PER_PAGE, (page + 1) * BOOKS_PER_PAGE));
};

/**
 * Populates an HTML overlay with book details when a list item representing a book is clicked.
 */
const handleListItemClick = event => {
  // Array of all the elements nodes the event.target will bubble up from.
  const pathArray = Array.from(event.path || event.composedPath());
  /**
   * Stores the active book object.
   * @type {Object|null}
   */
  let active;

  /**
   * Loop through the DOM elements in the pathArray to find the book with matching ID.
   */
  for (const node of pathArray) {
    if (active) break;

    /**
     * Extract the previewId from the element's dataset.
     * @type {string|undefined}
     */
    const previewId = node?.dataset?.preview;

    /**
     * If no previewId is found, skip to the next element in the pathArray.
     */
    if (!previewId) continue;
    /**
     * Search for the book with matching id in the "books" array and asssign active = book.
     */
    for (const singleBook of books) {
      if (singleBook.id === previewId) {
        active = singleBook;
        break;
      }
    }
  }

  if (!active) return;

  const { image, title, author, published, description } = active;

  html.list.blur.src = image;
  html.list.image.src = image;
  html.list.title.innerText = title;
  html.list.subtitle.innerText = `${authors[author]} (${new Date(published).getFullYear()})`;
  html.list.description.innerText = description;

  html.list.overlay.open = true;
};

/**
 * Update the dark/light mode based on user preferences submitted through the form.
 */
const updateDarkLightMode = event => {
  event.preventDefault();
  /**
   * Represents form data containing user preferences.
   * @type {FormData}
   */
  const formData = new FormData(event.target);
  /**
   * Represents the theme preference selected by the user.
   * @type {string}
   */
  const { theme } = Object.fromEntries(formData);

  // Update CSS variables based on user theme preference
  document.documentElement.style.setProperty("--color-dark", css[theme].dark);
  document.documentElement.style.setProperty("--color-light", css[theme].light);
  html.settings.overlay.open = false;
};

/**
 * Filter function for submitting the form data and showing the book previews in the html
 */
const handleFilterFormSubmit = event => {
  event.preventDefault();
  /** Extracts the form data from the submitted event.*/
  const formData = new FormData(event.target);
  /** Converts the FormData object into a regular JavaScript object.*/
  const filters = Object.fromEntries(formData);
  /** An array to store the filtered books. */
  const result = [];
  // Resets the page to 1 after form submission.
  page = 1;

  const filtersTitle = filters.title.trim().toLowerCase();
  const filtersAuthor = filters.author;
  const filtersGenre = filters.genre;

  // Loop through each book in the 'books' array to check for matches based on filters.
  // Added a guard clause for best practice so that if the title, author, genre doesn't match, skip this book and continue with the next iteration.
  for (const singleBook of books) {
    const titleMatch = filtersTitle === "" || singleBook.title.toLowerCase().includes(filtersTitle);
    if (!titleMatch) continue;

    const authorMatch = filtersAuthor === "any" || singleBook.author === filtersAuthor;
    if (!authorMatch) continue;

    const genreMatch = filtersGenre === "any" || singleBook.genres.includes(filtersGenre);
    if (!genreMatch) continue;

    if (titleMatch && authorMatch && genreMatch) {
      result.push(singleBook);
    }
  }
  // Show or hide the message element depending on the number of filtered results.
  if (result.length < 1) {
    html.list.message.classList.add("list__message_show");
  } else {
    html.list.message.classList.remove("list__message_show");
  }
  // Clear the current content in the list items container.
  html.list.items.innerHTML = "";
  // Update the 'matches' variable with the filtered book array.
  matches = result;
  // Append the newly filtered book previews to the list items container.
  html.list.items.appendChild(createPreviewsFragment(matches));
  // Scrolls the page to the top (smooth scroll) after filtering.
  window.scrollTo({ top: 0, behavior: "smooth" });
  html.search.overlay.open = false;
  html.search.form.reset();
};

html.search.button.addEventListener("click", handleSearchButtonClick);

html.search.cancel.addEventListener("click", handleSearchCancelClick);

html.settings.button.addEventListener("click", handleSettingsButtonClick);

html.settings.cancel.addEventListener("click", handleSettingsCancelClick);

html.list.close.addEventListener("click", handleBookPreviewCloseClick);

html.list.button.addEventListener("click", handleListButtonClick);

html.list.items.addEventListener("click", handleListItemClick);

html.settings.form.addEventListener("submit", updateDarkLightMode);

html.search.form.addEventListener("submit", handleFilterFormSubmit);
