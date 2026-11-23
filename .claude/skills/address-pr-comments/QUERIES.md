# GitHub GraphQL calls

## Unresolved review threads

```bash
gh api graphql -F owner='{owner}' -F repo='{repo}' -F number={number} -f query='
query($owner: String!, $repo: String!, $number: Int!) {
  repository(owner: $owner, name: $repo) {
    pullRequest(number: $number) {
      reviewThreads(first: 100) {
        nodes {
          id
          isResolved
          isOutdated
          path
          line
          originalLine
          comments(first: 20) {
            nodes {
              id
              databaseId
              author { login }
              body
              createdAt
              diffHunk
              url
            }
          }
        }
      }
    }
  }
}'
```

## Resolve a thread

```bash
gh api graphql -F threadId='{thread.id}' -f query='
mutation($threadId: ID!) {
  resolveReviewThread(input: { threadId: $threadId }) {
    thread { id isResolved }
  }
}'
```

## Reply without resolving

```bash
gh api repos/{owner}/{repo}/pulls/{number}/comments \
  -f body='<text>' -F in_reply_to={comment.databaseId}
```

## PR-level comments

Comments on the PR itself — not threads:

```bash
gh api repos/{owner}/{repo}/issues/{number}/comments \
  --jq '.[] | {id, author: .user.login, created_at, body}'
```

Reply on the PR:

```bash
gh pr comment {number} --body-file <file>
```
