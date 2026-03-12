# Beyond the push: What is git, what is it doing under the hood, and how to use it the way it was intended to be used.

I have struggled with git since learning about it three years ago in my introductory CS courses. I only really know how to initialize a repo, add files, commit, and push to the remote repository. However git is more than just a cloud storage for code, it is a version control tool. I want to go deeper than my current knowlegde of git and understand why it was such a great version control and why it still is the industry standard when it comes to code collaboration. I will list all the sources I used to gather information about git up top for easy access.

**Disclaimer** This is written as more of a clarification and deeper dive to those who have already broken a few Git repos. This isn't written as an introduction to Git.

## Sources

- **[Git Will Finally Make Sense After This](https://youtu.be/Ala6PHlYjmw?si=2MRrq_tziHGTpmI1)**: A video by LearnThatStack that explains how Git works.
- **[Visualize Git](https://visualizegit.com/)**: A website that visually shows what happens when you call a git command.

* **[What is HEAD in Git](https://www.codingem.com/what-is-head-in-git/)**: Codingem's tutorial on what the HEAD pointer is.

## What is Git

Setting aside all previous assupmtions and starting over, we define Git.

**Git** is a database. And the data stored in that database are _commits_.

**Commits** are records of the repository at a certain point in time. They aren't just recorded changes but the actual state of the files when the commit was taken. A commit contains three things:

1. A pointer to the commit record that has the state of all the files.

2. Metadata about who committed, when the commit happened, and why, the commit message given at the time of commit.

3. A pointer to the Parent commit (BACKWARDS!)

This means that each commit made points back to the commit that comes before it. This is like a singly linked list, where the initial commit doesn't have a parent pointer. When you merge a branch into a commit (this string of linked commits) you make a commit with two parents.

### The Git Tree

As commits are added to Git (the database), children know who their parents are, but parents do not know who their children are. The existing pointers that are assigned between the commits are what Git uses when operations like merge, reset, and rebase are used (more on them later). This means that Git trees are DAGS (Directed Acyclic Graphs) which means, despite feeling complex once we have competing branches, the Git tree remains simple. There is no circular history that would break backtracking, and no way for a commit to overwite another commit in trying to fix conflicts.

![The git tree DAG by LearnThatStack](./DAG_gitTree_LearnThatStack.png)

This tree of commits is very helpful when it comes to having a record of your project. Each commit is a complete snapshot, so you can restore the project to any existing commit at any time. There is no walking back up the tree by inversly applying all the changes made. This is done by setting your HEAD pointer to the desired commit.

![Head pointer on last commit](./HEAD_set_lastCommit_LearnThatStack.png)

The HEAD pointer on most recent commit.

![Head pointer on older commit](./HEAD_set_old_commit_LearnThatStack.png)

The HEAD pointer is moved to older commit, the state immediately available.

### Navigating the Git Tree

**HEAD** is a pointer that tracks where you are in the Git tree.
