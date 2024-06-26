import argparse
import pandas as pd
import requests
import pickle
import numpy as np
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# numpy rng initialization
rng = np.random.default_rng(42)

# Argument parser
parser = argparse.ArgumentParser(description="Process dataset and send POST requests")
parser.add_argument("input_file", type=str, help="Path to the input Excel file")
parser.add_argument(
    "--load", action="store_true", help="Load and print the results pickle"
)
parser.add_argument(
    "--analyze", action="store_true", help="Perform metrical analysis on the results"
)
parser.add_argument(
    "--run_name",
    type=str,
    help="Name of the run to be stored in the results pickle",
)
parser.add_argument(
    "--path",
    type=str,
    required=True,
    help="Path to the graph to be used for the benchmark",
)
args = parser.parse_args()

if args.path is None:
    print("Path to the graph is not provided")
    exit(1)


def print_results(results):
    # Print the results
    for _id, score in results.items():
        print(f"ID: {_id}, Score: {score[0]}, Text: {score[1]}")


def perform_analysis(input_file, results: dict):
    # Read dataset from Excel file
    df = pd.read_excel(input_file)

    # Extract scores from the Excel file and the results
    excel_scores = df["score"].values
    escel_correct = df["correct"].values
    result_scores = np.array(
        [results[_id][1] for _id in df["id"]]
    )  # no backward compatibility
    # when score 3<= then correct is 1, otherwise 0
    result_correct = np.array([1 if score >= 3 else 0 for score in result_scores])

    # Calculate metrics
    mse = mean_squared_error(excel_scores, result_scores)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(excel_scores, result_scores)
    r2 = r2_score(excel_scores, result_scores)

    mse_correct = mean_squared_error(escel_correct, result_correct)
    rmse_correct = np.sqrt(mse_correct)
    mae_correct = mean_absolute_error(escel_correct, result_correct)
    r2_correct = r2_score(escel_correct, result_correct)

    result_metrics = {
        "mse": mse,
        "rmse": rmse,
        "mae": mae,
        "r2": r2,
        "mse_correct": mse_correct,
        "rmse_correct": rmse_correct,
        "mae_correct": mae_correct,
        "r2_correct": r2_correct,
    }

    # Print the metrics
    print("Metrical analysis:")
    print(f"Mean Squared Error (MSE): {mse}")
    print(f"Root Mean Squared Error (RMSE): {rmse}")
    print(f"Mean Absolute Error (MAE): {mae}")
    print(f"R-squared (R²): {r2}")
    print(f"Mean Squared Error (MSE) for correct: {mse_correct}")
    print(f"Root Mean Squared Error (RMSE) for correct: {rmse_correct}")
    print(f"Mean Absolute Error (MAE) for correct: {mae_correct}")
    print(f"R-squared (R²) for correct: {r2_correct}")

    print("0 hypothesis: The model is not better than the baseline (random vlaues)")
    baseline = rng.uniform(0, 5, len(excel_scores))
    mse = mean_squared_error(excel_scores, baseline)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(excel_scores, baseline)
    r2 = r2_score(excel_scores, baseline)

    mse_correct = mean_squared_error(
        escel_correct, rng.integers(0, 2, len(excel_scores))
    )
    rmse_correct = np.sqrt(mse_correct)
    mae_correct = mean_absolute_error(
        escel_correct, rng.integers(0, 2, len(excel_scores))
    )
    r2_correct = r2_score(escel_correct, rng.integers(0, 2, len(excel_scores)))

    baseline_metrics = {
        "mse": mse,
        "rmse": rmse,
        "mae": mae,
        "r2": r2,
        "mse_correct": mse_correct,
        "rmse_correct": rmse_correct,
        "mae_correct": mae_correct,
        "r2_correct": r2_correct,
    }
    print(f"Mean Squared Error (MSE): {mse}")
    print(f"Root Mean Squared Error (RMSE): {rmse}")
    print(f"Mean Absolute Error (MAE): {mae}")
    print(f"R-squared (R²): {r2}")
    print(f"Mean Squared Error (MSE) for correct: {mse_correct}")
    print(f"Root Mean Squared Error (RMSE) for correct: {rmse_correct}")
    print(f"Mean Absolute Error (MAE) for correct: {mae_correct}")

    # Save the results in a xlsx file with the timestamp
    df = pd.DataFrame(
        {
            "excel_scores": excel_scores,
            "excel_correct": escel_correct,
            "result_scores": result_scores,
            "result_correct": result_correct,
            "baseline_scores": baseline,
            "baseline_correct": rng.integers(0, 2, len(excel_scores)),
            "result_metrics": [result_metrics] * len(excel_scores),
            "baseline_metrics": [baseline_metrics] * len(excel_scores),
        }
    )
    timestamp = pd.Timestamp.now().strftime("%Y-%m-%d_%H-%M-%S")
    save_path = (
        f"results_{args.run_name if args.run_name else 'default'}_{timestamp}.xlsx"
    )
    df.to_excel(save_path, index=False)


if args.load:
    # Load the results pickle
    with open("results.pkl", "rb") as file:
        results = pickle.load(file)

    print_results(results)

    if args.analyze:
        perform_analysis(args.input_file, results)

else:
    # Read dataset from Excel file
    df = pd.read_excel(args.input_file)

    # Dictionary to store the results
    results: dict = {}
    length = len(df)
    # Iterate over each row in the dataset
    for index, row in df.iterrows():
        _id = row["id"]
        question = row["question"]
        real_answer = row["real_answer"]
        answer = row["answer"]

        # Prepare the JSON payload
        payload = {
            "path": args.path,
            "data": {"question": question, "realAnswer": real_answer, "answer": answer},
        }

        # Send POST request
        response = requests.post("http://localhost:5000/v1/benchmark", json=payload)

        # Extract the result from the response
        result = response.json()

        # Store the result in the dictionary. result is a tuple [score,text]
        results[_id] = result
        print(f"ID: {_id}, Score: {result[0]}, Text: {result[1]}\n")
        print(f"Progress: {index+1}/{length}")
    print("Benchmark finished")

    # Save the results as a pickle dump
    with open("results.pkl", "wb") as file:
        pickle.dump(results, file)
