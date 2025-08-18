# UVBunny
This project will be built in several stages.

## Project Setup
1. Create a new Node project
  - set up in a folder called `./api`
  - add dependency `firebase-tools` and run through firebase installation
2. Create a new Angular project
  - set up in a folder called `./web`
  - use AngularFire
  - add Bootstrap 5

## Front-end
### Routes
- the home page at path `/`. It should contain a bunny dashboard with the following features:
  - a number showing the total number of bunnies
  - a number showing the average happiness across all bunnies
  - a list of bunnies
    - each bunny tile should display:
      - name
      - avatar
      - happiness value
    - clicking on a bunny opens up the specific bunny page at `/bunnies/:id`
  - a button for adding a new bunny by specifying name in a text field
    - we will only allow the text field to process alphanumeric and dash and underscore characters, ignoring everything else
- the specific bunny page at `/bunnies/:id` should:
  - display all of the bunny properties:
    - name
    - number of carrots_eaten
    - number of lettuce_leaves_eaten
      - happiness equal to the sum of each activity times its associated points:
        - lettuce_leaves_eaten * EATING_LETTUCE_POINTS
        - carrots_eaten * EATING_CARROT_POINTS
        - play_dates_had * PLAY_DATE_POINTS
  - have a button to increment carrots_eaten; this should record an increment or set event and trigger state re-calculation
  - have a button to increment lettuce_leaves_eaten ; this should record an increment or set event and trigger state re-calculation
  - have a selector for recording a play date
    - there should be a dropdown containing the names of every bunny besides the current one being displayed
    - a button to record play date assuming bunny was selected; this button should be disabled if a bunny wasn't selected from the dropdown
    - selecting bunny and pressing button should record EVENT.PLAY_DATE; this should trigger resulting state calculation
- configuration page at `/config`
  - edit EATING_CARROT_POINTS, EATING_LETTUCE_POINTS, PLAY_DATE_POINTS values
    - default values should start at 3, 1, 2 respectively
  - update should trigger calculating state retroactively

### Version 2 (don't implement this yet)
- Specific bunny page will be accessible by /bunnies/url-safe%20name instead of id
- We will enforce uniqueness on name to ensure there only exists one page per bunny
- Homepage should support optional avatar image upload with a stylized upload button when creating a new bunny
- Homepage result set of bunnies will include a square crop of the avatar image or a default if there isn't one for the given bunny
- Specific bunny page will show large avater image cropped to a square
- Add file blob type avatar field to the POST /bunnies endpoint
- Add avatar field to bunny object in GET /dashboard and GET /bunnies/:id

## API Routes
- GET /dashboard?page=2&limit=20
  - returns {
      bunnies: [{
        id: 123,
        name: "ellie", <-- projected field
        happiness: 31 <-- calculated field
      },...],
      bunnies_count: 54 <-- calculated field,
      happiness_average: 16.7 <-- calculated field,
      limit: 20,
      page: 2
    }
- GET /bunnies/:id
  - returns {
    id: 123,
    name: "ellie", <-- projected field
    carrots_eaten: 5, <-- projected field
    lettuce_eaten: 8, <-- projected field
    play_dates_had: 4, <-- projected field; this value applies to both bunnies
    happiness: 31 <-- calculated field
  }
- POST /bunnies
  - payload = {
    name: "Hopefully unique name"
  }
  - returns {
    success: true,
    message: "Bunny created."
  } OR { success: false, message: "Name already taken." }
- POST /events
  - payload = {
    bunny_id: 123,
    name: "INC_CARROT_EATEN",
    count: 2
  } OR {
    bunny_id: 123,
    play_date_id: 456, <-- note that this value also affects bunny_id: 456
    name: "INC_PLAY_DATE_HAD",
    count: 1
  }

## Back-end
We're using Firebase Functions to serve API endpoints connected to Firestore. We have Event, StateSnapshot, and CacheState objects. We're using dotenv to store credentials.

## Data Management
We're using Firebase's NoSQL datastore to implement Event Sourcing for our application data. We can leverage real-time listeners to update rollup snapshots or cached API calls. Here snapshot is the Event Sourcing concept meaning an aggregate summary of previous Events and not the Firebase snapshot which means the latest version of a given document entry.

### Data Model
- all canoncial data is stored as a collection of Event objects
- regular Snapshots are taken which represent roll-up aggregates of Event summaries
- cached calculations are stored as API response objects

### Calculating State
- get lastest snapshot; if none exists use default values (e.g. 0 for carrots_eaten etc)
- get all events since last snapshot
- call map/reduce on events to calculate new aggregates or create entities
- cache aggregates and entities

### After New Event
- if unrolled_event_count >= 100 (configurable), generate new snapshot; reset counter to 0
- run calculating state steps listed above
- increment unrolled_event_count

The number I chose to trigger a new snapshot is a compromise between accuracy and performance; the number is low enough that re-calculation in memory can be done in a reasonable amount of time but high enough that we aren't storing snapshots after every event. The best number for this is predicated on many factors and in a real-life production system would likely have to be configured based on load and related metrics.

I originally had new events triggering incremental calculations of state values. This opened up the system to the issue of a race condition where two events being stored at (almost) the same time resulting in inaccurate calculations of the aggregate (they would miss the other event). Re-calculating the aggregate ensures accuracy and comes at the cost of some performance. 

### If calculations take too long
We can move the state calculations to a background process and use incremental math to calculate the "current" state from the last event. This has the drawback of potentially being inaccurate when there's a race condition or multiple writes for the same user. This is probably a fine trade off since the next request, assuming it's after the background job is done, will have the latest value. The user likely won't notice the missing record in the interim.

### Performance Considerations
1. `/dashboard` will load _all_ bunny data; add pagination to offload this
