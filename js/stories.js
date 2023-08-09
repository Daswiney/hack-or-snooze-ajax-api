"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

// Define $favoritedStoriesList
const $favoritedStoriesList = $("#favorited-stories-list"); // Change the selector accordingly

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  if ($("#toggle-favorites").text() === "Show All Stories") {
    putStoriesOnPage(true); // Show only favorite stories
  } else {
    putStoriesOnPage(); // Show all stories
  }

  synchronizeFavoriteButtonState();
}

function synchronizeFavoriteButtonState() {
  if (currentUser) {
    const favoriteStoryIds = currentUser.favorites;
    $(".favorite-btn").each(function () {
      const storyId = $(this).closest("li").attr("id");
      if (favoriteStoryIds.includes(storyId)) {
        $(this).addClass("favorited");
      } else {
        $(this).removeClass("favorited");
      }
    });
  }
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);
  const hostName = story.getHostName ? story.getHostName() : ""; 

  const deleteButton = currentUser && story.username === currentUser.username
    ? `<button class="delete-btn">Delete</button>`
    : "";

  return $(`
    <li id="${story.storyId}">
      <a href="${story.url}" target="_blank" class="story-link">
        ${story.title}
      </a>
      ${deleteButton}
      <button class="favorite-btn ${story.isFavorite ? 'favorited' : ''}">Favorite</button>
      <small class="story-hostname">(${hostName})</small>
      <small class="story-author">by ${story.author}</small>
      <small class="story-user">posted by ${story.username}</small>
    </li>
  `);
}

$allStoriesList.on("click", ".favorite-btn", async function (event) {
  event.preventDefault();
  if (!currentUser) return;

  const $storyElement = $(this).closest("li");
  const storyId = $storyElement.attr("id");
  const story = storyList.stories.find(story => story.storyId === storyId);

  if (!story) return;

  if (!story.isFavorite) {
    await currentUser.addFavorite(story.storyId);
    story.isFavorite = true;
    $(this).addClass("favorited");
  } else {
    await currentUser.removeFavorite(story.storyId);
    story.isFavorite = false;
    $(this).removeClass("favorited");
  }
});

$allStoriesList.on("click", ".delete-btn", async function (event) {
  event.preventDefault();

  const $storyElement = $(this).closest("li");
  const storyId = $storyElement.attr("id");
  const story = storyList.stories.find(story => story.storyId === storyId);

  if (story) {
    await storyList.removeStory(currentUser, storyId);
    $storyElement.remove();
  }
});

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage(displayType = "all") {
  $allStoriesList.empty();

  let storiesToShow = [];
  
  if (displayType === "all") {
    storiesToShow = storyList.stories;
  } else if (displayType === "favorites") {
    storiesToShow = storyList.stories.filter(story => currentUser.favorites.includes(story.storyId));
  } else if (displayType === "user") {
    storiesToShow = storyList.stories.filter(story => story.username === currentUser.username);
  }

  for (let story of storiesToShow) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  // Update favorite button classes based on the current user's favorites
  $allStoriesList.find(".favorite-btn").each(function () {
    const storyId = $(this).closest("li").attr("id");
    if (currentUser.favorites.includes(storyId)) {
      $(this).addClass("favorited");
    } else {
      $(this).removeClass("favorited");
    }
  });

  $allStoriesList.show();
}




/**
 * Submits the story form, adds the new story, and updates the page.
 */
async function submitStoryForm(event) {
  event.preventDefault();

  const title = document.getElementById('title').value;
  const author = document.getElementById('author').value;
  const url = document.getElementById('url').value;

  // Call the addStory method
  const addedStory = await storyList.addStory(currentUser, { title, author, url });

  if (addedStory) {
    // Display the added story on the page
    const $addedStory = generateStoryMarkup(addedStory);
    $allStoriesList.prepend($addedStory); // Insert at the beginning of the list
    // Clear the form
    document.getElementById('title').value = '';
    document.getElementById('author').value = '';
    document.getElementById('url').value = '';
    // Hide the form
    document.getElementById('story-form').style.display = 'none';
  }
}

document.getElementById('story-form').addEventListener('submit', submitStoryForm);







