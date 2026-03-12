---
slug: llm-fine-tuning
title: An Amateurish Understanding of LLMs & Fine-Tuning
date: Jul 9, 2025
category: AI/ML
summary: Wrote this during my summer internship. I was learning to apply LLMs to build a chatbot at the time and decided to document my findings as a way to better understand the higher-level concepts.
---

I was first introduced to the concept of **Large Language Models (LLMs)** through a live online lecture a few years back, during a time when ChatGPT didn't exist to write articles and Co-Pilot was barely functional. The speaker offered a rather abstract explanation:

> A model capable of emulating human conversation after being trained with a copiously large database of varied queries and corresponding responses

Clearly, this definition leaves many gaps for questioning when left to be pondered upon on its own. Here was my list:

1. Wait so, how exactly does it work?
2. ...

Well, though that isn't a list it was certainly still one *very big gap*. Despite such, I'd argue that this definition is sufficient to acquire a general idea of LLMs.

Recently, with the growing integration of chatbots and AI tools in our day-to-day activities and business operations, I've become increasingly fascinated with the mathematics and technicalities behind LLMs. After extensive readings on the subject, this is an amateur's best attempt at an abstraction:

Imagine that our input data is sand. LLMs can be thought of as a "super sieve" composed of multiple layers of filters through which our sand is passed. Each of its properties (the amount of sand, the rate and manner in which we are pouring it) influences the final result obtained. The greater the number or size of layers involved, the greater the capacity for complexity and variability in our output.

In a similar manner, LLMs are composed of countless layers of neural networks which process our data as it passes through every "filter" one at a time. To put it simply, neural networks can be represented as matrices of numbers, also known as parameters or weights. The more parameters an LLM has, the more powerful it will be in generating dynamic responses for a wide range of inputs.

At its core, base models of LLMs are great for general purposes. However, it is its generalization that also renders certain, specific business use cases impossible to handle.

Here's where **fine-tuning** comes into play. In simple terms, fine-tuning can be described as:

> The process of adjusting parameters to help LLMs "learn" the expected response for a given specified context

Going back to our sand-and-sieve abstraction, fine-tuning essentially involves making small adjustments to our filters to produce a more aligned output whilst maintaining the complexity of our sieve.

This process is typically repeated over a specified number of iterations known as **epochs**.

The fine-tuning process begins with **initialization**, where the model's parameters are set to random values. Because these parameters are randomly initialized, the model at this stage has no meaningful knowledge of the data or the task.

Each epoch of training consists of several key steps. First, **forward propagation** occurs. In this step, input data is passed through the model's layers to produce an output or prediction. This output is then evaluated against the actual target using a **loss function**, which calculates the **loss**, or the error between the model's prediction and the true values.

Next comes **backward propagation**, which is where the model actually learns. During this phase, the model's parameters are updated according to the error calculated. This adjustment is done using **gradient descent**, an optimization algorithm that updates each parameter in the direction that reduces the loss. Specifically, it moves in the direction of the **negative gradient** of the loss function, taking small steps determined by a value called the **learning rate**.

It's important to note that while gradient descent aims to minimize the loss, it doesn't always find the best possible solution. It may converge to a **local minimum**, where the loss is lower than in surrounding regions but not the lowest possible overall. Ideally, the algorithm would find the **global minimum**, the point where the loss is at its absolute lowest, but this is not always guaranteed.

Through repeated epochs, with forward and backward propagation at each step, the model gradually refines its parameters, improving its performance on the training data and ideally generalizing well to new, unseen data.

However, making too many adjustments may completely alter our LLM, resulting in what is known as catastrophic forgetting. Yes, as the name suggests, LLMs can in fact forget the data it was originally trained on if it is over-tuned. *Catastrophic indeed...*

One of the most common ways to mitigate this risk is through a process known as **Parameter Efficient Fine Tuning (PEFT)**, wherein the parameters of an LLM are frozen and only relevant parameters are selected to be fine-tuned.

There are two ways we can further optimize PEFT: **Low Rank Adaptation (LoRA)** and **Quantized Low Rank Adaptation (QLoRA)**.

LoRA involves deriving the update matrix through multiplying a pair of smaller matrices, also known as adapters (QLoRA just further quantizes the weights of the LoRA Adapters). While it may be impossible to find an exact match through matrix multiplication, this approximation significantly reduces the amount of trainable parameters required, hence improving fine tuning speed. There are several key settings that can be used to adjust our LoRA:

- Rank: The width and height of the adapters
- Alpha: The scaling factor for the update matrix
- Dropout: The percentage of randomly selected parameters to be set to 0

I'd like to highlight dropout specifically, as it avoids another issue known as **overfitting** by avoiding overreliance on some parameters. Overfitting occurs if a model is trained too many times, causing the model to be too rigid (that is, it performs well on training data but poorly for unseen data).

And there you have it, an amateurish guide to basic LLMs and fine-tuning.