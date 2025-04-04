/*
 * routes definition and handling for paramHashRouter
 */

import Mustache from "./mustache.js";
import processOpnFrmData from "./addOpinion.js";
import articleFormsHandler from "./articleFormsHandler.js";

//an array, defining the routes
export default[

    {
        //the part after '#' in the url (so-called fragment):
        hash:"welcome",
        ///id of the target html element:
        target:"router-view",
        //the function that returns content to be rendered to the target html element:
        getTemplate:(targetElm) =>
            document.getElementById(targetElm).innerHTML = document.getElementById("template-welcome").innerHTML
    },
    {
        hash:"articles",
        target:"router-view",
        getTemplate: fetchAndDisplayArticles
    },
    {
        hash:"opinions",
        target:"router-view",
        getTemplate: createHtml4opinions
    },
    {
        hash:"addOpinion",
        target:"router-view",
        getTemplate: (targetElm) =>{
            document.getElementById(targetElm).innerHTML = document.getElementById("template-addOpinion").innerHTML;
            document.getElementById("opnFrm").onsubmit=processOpnFrmData;
        }
    },
    
    {
            hash: "article",
            target: "router-view",
            getTemplate: (targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) => {
                fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash);
            }
        }
        
    ,
    {
        hash:"artEdit",
        target:"router-view",
        getTemplate: editArticle
    },
    {
        hash: "artDelete",
        target: "router-view",
        getTemplate: deleteArticle
    },
    {
        hash: "artInsert",
        target: "router-view",
        getTemplate: addNewArticle
    },    

];

const urlBase = "https://wt.kpi.fei.tuke.sk/api";
const articlesPerPage = 20;  

function createHtml4opinions(targetElm){
    const opinionsFromStorage=localStorage.myOpinions;
    let opinions=[];

    if(opinionsFromStorage){
        opinions=JSON.parse(opinionsFromStorage);
        opinions.forEach(opinion => {
            opinion.created = (new Date(opinion.created)).toDateString();
            opinion.willReturn = 
            opinion.willReturn?"I will return to this page.":"Sorry, one visit was enough.";
        });
    }

    document.getElementById(targetElm).innerHTML = Mustache.render(
        document.getElementById("template-opinions").innerHTML,
        opinions
        );
}  


function fetchAndDisplayArticles(targetElm, offsetFromHash, totalCountFromHash) {
    let offset = parseInt(offsetFromHash);
    let totalCount = parseInt(totalCountFromHash);

    if (isNaN(offset) || isNaN(totalCount)) {
        // Если offset или totalCount отсутствует, запрашиваем общее количество статей
        const url = `${urlBase}/article?max=1`; // Минимальный запрос для получения общего количества
        fetch(url)
            .then(response => {
                if (!response.ok) throw new Error("Ошибка получения количества статей");
                return response.json();
            })
            .then(data => {
                totalCount = data.meta.totalCount;
                offset = 0; // Устанавливаем начальный оффсет
                // Обновляем хеш в формате #articles/0/totalCount
                window.location.hash = `#articles/${offset}/${totalCount}`;
            })
            .catch(err => {
                console.error("Ошибка:", err.message);
                document.getElementById(targetElm).innerHTML = `<p>${err.message}</p>`;
            });
        return;
    }

    const maxArticles = articlesPerPage;
    const currentPage = Math.floor(offset / maxArticles) + 1;
    const totalPages = Math.ceil(totalCount / maxArticles);

    const urlQuery = `?offset=${offset}&max=${maxArticles}`;
    const url = `${urlBase}/article${urlQuery}`;

    function reqListener() {
        if (this.status == 200) {
            const responseJSON = JSON.parse(this.responseText);
            addArtDetailLink2ResponseJson(responseJSON);

            const data4rendering = {
                currPage: currentPage,
                pageCount: totalPages,
                articles: responseJSON.articles,
            };

            if (currentPage > 1) {
                data4rendering.prevPage = `#articles/${offset - maxArticles}/${totalCount}`;
            }
            if (currentPage < totalPages) {
                data4rendering.nextPage = `#articles/${offset + maxArticles}/${totalCount}`;
            }

            document.getElementById(targetElm).innerHTML = Mustache.render(
                document.getElementById("template-articles").innerHTML,
                data4rendering
            );
        } else {
            const errMsgObj = { errMessage: this.responseText };
            document.getElementById(targetElm).innerHTML =
                Mustache.render(
                    document.getElementById("template-articles-error").innerHTML,
                    errMsgObj
                );
        }
    }

    var ajax = new XMLHttpRequest();
    ajax.addEventListener("load", reqListener);
    ajax.open("GET", url, true);
    ajax.send();
}




function addArtDetailLink2ResponseJson(responseJSON){
    responseJSON.articles = responseJSON.articles.map(
      article =>(
       {
         ...article,
         detailLink:`#article/${article.id}/${responseJSON.meta.offset}/${responseJSON.meta.totalCount}`
       }
      )
    );
  }   
  
  // Fix for adding and viewing comments

  function fetchAndDisplayArticleDetail(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash, false)
        .then(article => {
            const commentsUrl = `${urlBase}/article/${artIdFromHash}/comment`;

            fetch(commentsUrl)
                .then(response => {
                    if (!response.ok) throw new Error("Failed to fetch comments");
                    return response.json();
                })
                .then(commentsData => {
                    renderComments(targetElm, commentsData.comments.slice(0, 100));
                    setupCommentForm(targetElm, artIdFromHash);
                })
                .catch(err => {
                    console.error("Error fetching comments:", err);
                    document.getElementById(targetElm).innerHTML += `<p>Error loading comments: ${err.message}</p>`;
                });
        })
        .catch(err => {
            console.error("Error fetching article:", err);
        });
}

function renderComments(targetElm, comments) {
    if (!comments || comments.length === 0) {
        document.getElementById(targetElm).innerHTML += `<p>No comments yet. Be the first to comment!</p>`;
        return;
    }

    const commentsHtml = Mustache.render(
        document.getElementById("template-comments").innerHTML,
        { comments }
    );
    document.getElementById(targetElm).innerHTML += commentsHtml;
}

function setupCommentForm(targetElm, artId) {
    if (document.getElementById("addCommentButton")) return; // Prevent duplicate buttons/forms

    const addCommentHtml = `
        <button id="addCommentButton">Add Comment</button>
        <div id="commentFormContainer" style="display:none;">
            ${document.getElementById("template-comment-form").innerHTML}
        </div>`;

    const container = document.getElementById(targetElm);
    container.innerHTML += addCommentHtml;

    // Event listener for showing the comment form
    document.getElementById("addCommentButton").onclick = () => {
        document.getElementById("commentFormContainer").style.display = "block";
    };

    // Event listener for submitting the comment form
    const commentForm = document.getElementById("commentForm");
    if (commentForm) {
        commentForm.onsubmit = (event) => {
            event.preventDefault();
            processNewComment(artId);
        };
    }
}

function processNewComment(artId) {
    const authorName = document.querySelector("#commentForm #commentAuthor").value.trim();
    const commentText = document.querySelector("#commentForm #commentText").value.trim();

    if (!authorName || !commentText) {
        alert("Both author name and comment text are required.");
        return;
    }

    const commentsUrl = `${urlBase}/article/${artId}/comment`;
    const newComment = {
        text: commentText,
        author: authorName
    };

    fetch(commentsUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(newComment)
    })
        .then(response => {
            if (!response.ok) throw new Error("Failed to add comment");
            return response.json();
        })
        .then(() => {
            alert("Comment added successfully.");
            window.location.reload();
        })
        .catch(err => {
            console.error("Error adding comment:", err);
            alert("Error adding comment: " + err.message);
        });
} 


/**
 * Gets an article record from a server and processes it to html according to 
 * the value of the forEdit parameter. Assumes existence of the urlBase global variable
 * with the base of the server url (e.g. "https://wt.kpi.fei.tuke.sk/api"),
 * availability of the Mustache.render() function and Mustache templates )
 * with id="template-article" (if forEdit=false) and id="template-article-form" (if forEdit=true).
 * @param targetElm - id of the element to which the acquired article record 
 *                    will be rendered using the corresponding template
 * @param artIdFromHash - id of the article to be acquired
 * @param offsetFromHash - current offset of the article list display to which the user should return
 * @param totalCountFromHash - total number of articles on the server
 * @param forEdit - if false, the function renders the article to HTML using 
 *                            the template-article for display.
 *                  If true, it renders using template-article-form for editing.
 */
function fetchAndProcessArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash, forEdit) {
    return new Promise((resolve, reject) => {
        const url = `${urlBase}/article/${artIdFromHash}`;

        function reqListener() {
            if (this.status === 200) {
                const responseJSON = JSON.parse(this.responseText);
                const targetElement = document.getElementById(targetElm);

                if (!targetElement) {
                    reject(new Error(`Target element with id "${targetElm}" not found`));
                    return;
                }

                if (forEdit) {
                    responseJSON.formTitle = "Article Edit";
                    responseJSON.submitBtTitle = "Save article";
                    responseJSON.backLink = `#article/${artIdFromHash}/${offsetFromHash}/${totalCountFromHash}`;

                    targetElement.innerHTML =
                        Mustache.render(
                            document.getElementById("template-article-form").innerHTML,
                            responseJSON
                        );
                    if (!window.artFrmHandler) {
                        window.artFrmHandler = new articleFormsHandler("https://wt.kpi.fei.tuke.sk/api");
                    }
                    window.artFrmHandler.assignFormAndArticle("articleForm", "hiddenElm", artIdFromHash, offsetFromHash, totalCountFromHash);
                } else {
                    responseJSON.backLink = `#articles/${offsetFromHash}/${totalCountFromHash}`;
                    responseJSON.editLink =
                        `#artEdit/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;
                    responseJSON.deleteLink =
                        `#artDelete/${responseJSON.id}/${offsetFromHash}/${totalCountFromHash}`;

                    targetElement.innerHTML =
                        Mustache.render(
                            document.getElementById("template-article").innerHTML,
                            responseJSON
                        );
                }
                resolve(responseJSON);
            } else {
                const error = new Error(`Failed to fetch article: ${this.responseText}`);
                reject(error);
            }
        }

        console.log(url);
        const ajax = new XMLHttpRequest();
        ajax.addEventListener("load", reqListener);
        ajax.open("GET", url, true);
        ajax.send();
    });
}



function editArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) 
{
    fetchAndProcessArticle(...arguments,true);
}

function deleteArticle(targetElm, artIdFromHash, offsetFromHash, totalCountFromHash) {
    const url = `${urlBase}/article/${artIdFromHash}`;
    if (confirm("Are you sure you want to delete this article?")) {
        fetch(url, { method: "DELETE" })
            .then(response => {
                if (!response.ok) throw new Error("Error delete");
                window.location.hash = `#articles/${offsetFromHash}/${totalCountFromHash}`;
            })
            .catch(err => {
                document.getElementById(targetElm).innerHTML = `<p>${err.message}</p>`;
            });
    }
}

function addNewArticle(targetElm) {
    document.getElementById(targetElm).innerHTML =
        Mustache.render(
            document.getElementById("template-article-form").innerHTML,
            { formTitle: "Add New Article", submitBtTitle: "Create Article" }
        );

    if (!window.artFrmHandler) {
        window.artFrmHandler = new articleFormsHandler("https://wt.kpi.fei.tuke.sk/api");
    }
    window.artFrmHandler.assignFormAndArticle("articleForm", "hiddenElm");
}




   
  
