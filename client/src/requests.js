import { getAccessToken, isLoggedIn } from './auth';
import { ApolloClient, HttpLink, InMemoryCache, ApolloLink } from 'apollo-boost';
import gql from 'graphql-tag';

const endpointURL = 'http://localhost:9000/graphql';

const authLink = new ApolloLink((operation, forward) => {
    if (isLoggedIn()) {
        operation.setContext({
            headers: {
                'Authorization': 'Bearer ' + getAccessToken()
            }
        })
    }
    return forward(operation);
});

const client = new ApolloClient({
    link: ApolloLink.from([
        authLink,
        new HttpLink({uri: endpointURL})
    ]),
    cache: new InMemoryCache()
});

const jobDetailFragment = gql`
    fragment JobDetail on Job {
        id
        title
        company {
            id
            name
        }
        description
    }
`;

const jobQuery = gql`
    query JobQuery($id: ID!) {
        job(id: $id) {
            ...JobDetail
        }
    }
    ${jobDetailFragment}
`;

export async function createJob(input) {
    const mutation = gql`
        mutation CreateJob($input: CreateJobInput) {
            job: createJob(input: $input) {
                ...JobDetail
            }
        }
        ${jobDetailFragment}
    `;
    const { data } = await client.mutate({ 
        mutation,
        variables: { input },
        update: (cache, {data}) => {
            cache.writeQuery({ 
                query: jobQuery, 
                variables: {id: data.job.id},
                data
            })
        }
    });
    return data.job;
}

export async function loadCompany(id) {
    const query = gql`
        query CompanyQuery($id: ID!){
            company(id: $id) {
                id
                name
                description
                jobs {
                    id
                    title
                }
            }
        }
    `;
    const { data } = await client.query({ query, variables: { id } });
    return data.company;
}

export async function loadJob(id) {
    const { data } = await client.query({ query: jobQuery, variables: {id} });
    return data.job;
}

export async function loadJobs() {
    const query = gql`
        query JobsQuery{
            jobs {
                id
                title
                company {
                    id
                    name
                }
            }
        }
    `;
    const { data } = await client.query({query, fetchPolicy: 'no-cache'});
    return data.jobs;
}