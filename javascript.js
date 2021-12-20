//Author Alexander Sørensen, Dat20B 2021 - Programmerings eksamen
//variables used throughout the script
const UrlCandidates = "http://localhost:8080/kandidater"
const UrlParties = "http://localhost:8080/partier"
let sorted = false;
let candidates = []
let parties = []

//initial method calls to setup first rendition
fetchAllCandidates()
fetchAllParties()
setUpHandlers()

function setUpHandlers() {
    document.getElementById("party-head").onclick = sortTable
    document.getElementById("btn-new-candidate").onclick = makeNewCandidate
    document.getElementById("candidate-table-body").onclick = handleTableClick
    document.getElementById("btn-save").onclick = saveChanges
    document.getElementById("btn-end-election").onclick = endElection
}

//determine tableclick
function handleTableClick(evt) {
    evt.preventDefault()
    evt.stopPropagation()
    const target = evt.target

    //if delete button was clicked
    if (target.dataset.idDelete) {
        const idToDelete = Number(target.dataset.idDelete)
        const options = {
            method: "DELETE",
            headers: {'Accept': 'application/json'}
        }
        fetch(UrlCandidates + "/" + idToDelete, options)
            .then(res => res)
            .then(data => {
                console.log(data)
                fetchAllCandidates()
            })
    }
    //if edit button was clicked
    if (target.dataset.idEdit) {
        const idToEdit = Number(target.dataset.idEdit)
        const candidate = candidates.find(c => c.kandidatId == idToEdit)
        showModal(candidate)
    }

}

//create empty candidate object
function makeNewCandidate() {
    showModal({
        kandidatId: null,
        navn: "",
        antalStemmer: 0,
    })

}

//modal in bootstrap
function showModal(candidate) {
    const myModal = new bootstrap.Modal(document.getElementById("candidate-modal"))
    document.getElementById("modal-title").value = candidate.kandidatId ? "Edit Candidate" : "Create new Candidate"
    document.getElementById("candidate-id").innerText = candidate.kandidatId
    document.getElementById("input-name").value = candidate.navn
    document.getElementById("input-votes").value = candidate.antalStemmer
    myModal.show()
}


function saveChanges() {
    sorted=false
    //check if candidateId is present, to determine creation or updating
    const candidateId = Number(document.getElementById("candidate-id").innerText)
    let candidate = {}
    if (candidateId != 0) {
        candidate = candidates.find(c => c.kandidatId == candidateId)
    }

    //find party in array
    const party = document.getElementById("input-party").value
    const partyId = parties.find((p) => p.partiNavn == party).partiId

    candidate.navn = document.getElementById("input-name").value
    candidate.antalStemmer = document.getElementById("input-votes").value
    candidate.parti = parties.find(p => p.partiId == partyId)

//determine method + create header and body
    const method = candidateId ? "PUT" : "POST"
    const URLCreate = (method === "PUT") ? UrlCandidates + "/" + candidateId : UrlCandidates + "/" + partyId
    const options = {
        method: method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(candidate)
    }
    fetch(URLCreate, options)
        .then(res => {
            if (!res.ok) {
                throw "There was an error while doing the request"
            }
            return res.json()
        })
        .then(candidate => {
            //fetch the updated list of candidates
            fetchAllCandidates()
        })
        .catch(e => alert(e))
}

//fetch for candidates
function fetchAllCandidates() {
    fetch(UrlCandidates)
        .then(res => res.json())
        .then(data => {
            candidates = data
            setupTable()
        })
}

//fetch for parties
function fetchAllParties() {
    fetch(UrlParties)
        .then(res => res.json())
        .then(data => {
            parties = data
        })
}

//sort the list by party, if sorted then reverse order
function sortTable(evt) {
    evt.stopPropagation()
    if (!sorted) {
        candidates.sort((candidate1, candidate2) => {
            if (candidate1.parti.partiNavn < candidate2.parti.partiNavn) {
                return -1
            }
            if (candidate1.parti.partiNavn > candidate2.parti.partiNavn) {
                return 1
            }
            return 0
        })
        sorted = true
    } else if (sorted == true) {
        candidates.reverse()
    }
    setupTable()
}


function setupTable() {
    const rows = candidates.map(candidate => {
        return `<tr class="candidate">
            <td>${candidate.kandidatId}</td>
            <td>${encode(candidate.navn)}</td>
            <td>${encode(candidate.antalStemmer)}</td>          
            <td>${encode(candidate.parti.partiNavn)}</td>          
            <td><Button data-id-edit=${candidate.kandidatId}>Edit candidate</Button></td>
            <td><Button data-id-delete=${candidate.kandidatId}>Delete candidate</Button></td>
        </tr>`;
    })
    document.getElementById("candidate-table-body").innerHTML = rows.join("")
}

//encode to protect against injection attacks
function encode(str) {
    str = "" + str
    str = str.replace(/&/g, "&amp;");
    str = str.replace(/>/g, "&gt;");
    str = str.replace(/</g, "&lt;");
    str = str.replace(/"/g, "&quot;");
    str = str.replace(/'/g, "&#039;");
    return str;
}

function endElection(){
    let totalVotes = calculateTotalAmountOfVotes()

    const rows = parties.map(party => {
        return `<tr class="party">
            <td>${encode(party.partiNavn)}</td>         
            <td>${encode(party.partiBogstav)}</td>          
            <td>${getTotalPartyVotes(party.partiNavn)}</td>          
            <td>${getPartyVoteProcentage(party.partiNavn,totalVotes)+'%'}</td>      
        </tr>`;
    })
    //hide candidate table, build party rows and display table
    document.getElementById("table").style.display ="none"
    document.getElementById("vote-end-table-body").innerHTML = rows.join("")
    document.getElementById("end-table").style.display="table"
}


function calculateTotalAmountOfVotes(){
    let totalVotes =0
    candidates.forEach(c => totalVotes+=c.antalStemmer)
    return totalVotes
}

function getPartyVoteProcentage(party,totalvotes){
    let partyTotal=0;
    candidates.filter(c => c.parti.partiNavn==party).map(c => partyTotal+=c.antalStemmer)
    return partyTotal/totalvotes*100
}

function getTotalPartyVotes(party){
    let total=0;
    candidates.filter(c => c.parti.partiNavn==party).map(c => total+=c.antalStemmer)
    return total
}
