import pandas as pd
import openai
import pandas as pd
import numpy as np
from openai.embeddings_utils import distances_from_embeddings
import datetime
import os
import csv

from config import CONFIG

# Read the embeddings
#df=pd.read_csv(CONFIG['embeddings_csv'], index_col=0)
df=pd.read_csv(CONFIG['embeddings_csv'])
df['embeddings'] = df['embeddings'].apply(eval).apply(np.array)
#print(df.head())



def create_context(
    question, df, max_len=1800, size="ada"
):
    """
    Create a context for a question by finding the most similar context from the dataframe
    """

   
    # Get the embeddings for the question
    q_embeddings = openai.Embedding.create(input=question, engine='text-embedding-ada-002')['data'][0]['embedding']

    # Get the distances from the embeddings
    df['distances'] = distances_from_embeddings(q_embeddings, df['embeddings'].values, distance_metric='cosine')
    
    returns = []
    cur_len = 0

    # Sort by distance and add the text to the context until the context is too long
    for i, row in df.sort_values('distances', ascending=True).iterrows():
        
        # Add the length of the text to the current length
        cur_len += row['n_tokens'] + 4
        
        # If the context is too long, break
        if cur_len > max_len:
            break
        
        # Else add it to the text that is being returned
        returns.append(row["text"])

    # Return the context
    return "\n\n###\n\n".join(returns)


def append_to_csv(filename, row_dict):
    # Check if the file already exists
    file_exists = os.path.isfile(filename)

    # If the file doesn't exist, create it with the column names
    fieldnames = row_dict.keys()
    with open(filename, 'a', newline='') as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()

        # Write the new row to the CSV file
        writer.writerow(row_dict)

def answer_question(
    df,
    model="text-davinci-003",
    question="What can you tell me about Juan Merlos?",
    max_len=1800,
    size="ada",
    debug=True,
    max_tokens=150,
    stop_sequence=None,
    language="English",
    log_answer=False,
    answers_log_file='./logs/answers.log'
):
    """
    Answer a question based on the most similar context from the dataframe texts
    """
    context = create_context(
        question,
        df,
        max_len=max_len,
        size=size,
    )
    # If debug, print the raw model response
    if debug:
        print("Context:\n" + context)
        print("\n\n")

    try:

        prompt = f"Answer the question in {language} based on the context below, and if the question can't be answered based on the context, be creative and make up the answer.\n\nContext: {context}\n\n---\n\nQuestion: {question}"

        # Create a completions using the question and context
        response = openai.Completion.create(
            prompt = prompt,
            temperature=0,
            max_tokens=max_tokens,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0,
            stop=stop_sequence,
            model=model,
        )

        answer = response["choices"][0]["text"].strip()
        
        if log_answer:
           row = {
                'date': datetime.date.today(),
                'question': question,
                'prompt': prompt,
                'answer': answer
           }
           append_to_csv(answers_log_file, row)
        return response["choices"][0]["text"].strip()

    except Exception as e:
        print(e)
        return ""

