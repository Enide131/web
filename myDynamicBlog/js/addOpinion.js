/*
 * Created by Stefan Korecko, 2020-21
 * Opinions form processing functionality
 */

/*
This function works with the form:

<form id="opnFrm">
    <label for="nameElm">Your name:</label>
    <input type="text" name="login" id="nameElm" size="20" maxlength="50" placeholder="Enter your name here" required />
    <br><br>
    <label for="opnElm">Your opinion:</label>
    <textarea name="comment" id="opnElm" cols="50" rows="3" placeholder="Express your opinion here" required></textarea>
    <br><br>
    <input type="checkbox" id="willReturnElm" />
    <label for="willReturnElm">I will definitely return to this page.</label>
    <br><br>
    <button type="submit">Send</button>
</form>

 */
export default function processOpnFrmData(event) {
    // 1. Prevent normal event (form sending) processing
    event.preventDefault();

    // 2. Read and adjust data from the form (remove white spaces before and after the strings)
    const name = document.getElementById("nameElm").value.trim();
    const email = document.getElementById("emailElm").value.trim();
    const image = document.getElementById("imageElm").value.trim();
    const rating = document.querySelector('input[name="rating"]:checked')?.value;
    const likedFeatures = Array.from(document.querySelectorAll('input[name="likedFeatures[]"]:checked')).map(el => el.value);
    const keywords = document.getElementById("keywordsElm").value.trim();
    const comment = document.getElementById("opnElm").value.trim();
    const willReturn = document.getElementById("willReturnElm").checked;

    // 3. Verify the data
    if (name === "" || email === "" || comment === "" || rating === "") {
        window.alert("Please, enter all required fields: name, email, opinion, and rating.");
        return;
    }

    // 4. Prepare the new opinion object
    const newOpinion = {
        name: name,
        email: email,
        image: image,
        rating: rating,
        likedFeatures: likedFeatures,
        keywords: keywords,
        comment: comment,
        willReturn: willReturn,
        created: new Date()
    };

    // 5. Retrieve the existing opinions from localStorage
    let opinions = [];
    if (localStorage.myOpinions) {
        opinions = JSON.parse(localStorage.myOpinions);
    }

    // 6. Add the new opinion to the array
    opinions.push(newOpinion);
    localStorage.myOpinions = JSON.stringify(opinions);

    // 7. Go to the opinions section
    window.location.hash = "#opinions";
}
