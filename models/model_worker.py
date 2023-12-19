from torch import Tensor
from sentence_transformers import SentenceTransformer, util
import flask
import werkzeug

# import cors:
from flask_cors import CORS

model = SentenceTransformer("all-MiniLM-L6-v2")

app = flask.Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})


# path for getting cosine similarity based on two sentences
@app.route("/cosine_similarity", methods=["POST"])
def cosine_similarity():
    # get from body json
    sentence1 = flask.request.json["sentence_one"]
    sentence2 = flask.request.json["sentence_two"]

    print(sentence1)
    print(sentence2)
    # assert sentence1 is not None
    # assert sentence2 is not None
    if sentence1 is None or sentence2 is None:
        return werkzeug.exceptions.BadRequest("Bad Request")
    emb1 = model.encode(sentence1)
    emb2 = model.encode(sentence2)
    cos_sim: Tensor = util.cos_sim(emb1, emb2)
    result = cos_sim.tolist()[0][0]
    print(result)
    return flask.jsonify(result)


app.run(debug=True)
