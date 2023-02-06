const request = require("supertest");
const app = require("../app");
const assert = require("assert");

describe('POST /Signin', () => {
  it('should return user details if sign in is successful', () => {
    // Add your test code here
    // Use the assert module to check the results of your tests
    // assert.equal(actualValue, expectedValue, "Error message")
  });

  it('should return error message if sign in is unsuccessful', () => {
    // Add your test code here
  });
});

describe('GET /Order_ItemS', () => {
  it('should return the list of order items if the request is successful', () => {
    // Add your test code here
  });

  it('should return error message if the request is unsuccessful', () => {
    // Add your test code here
  });
});

describe('GET /product/:id', () => {
  it('should return the details of the product if the request is successful', () => {
    // Add your test code here
  });

  it('should return error message if the request is unsuccessful', () => {
    // Add your test code here
  });
});

describe("GET /order_item/:id", () => {
  it("returns an order item", (done) => {
    const order_id = "abc123";
    const options = {
      method: "GET",
      url: `/order_item/${order_id}`,
      headers: {
        Authorization: "Basic dXNlcm5hbWU6cGFzc3dvcmQ="
      }
    };
    server.inject(options, (response) => {
      const { payload } = response;
      assert.equal(response.statusCode, 200);
      assert.deepEqual(JSON.parse(payload), {
        order_id: "abc123",
        products: [
          { id: "p1", name: "product 1", quantity: 2 },
          { id: "p2", name: "product 2", quantity: 1 }
        ]
      });
      done();
    });
  });

  it("returns a 401 Unauthorized error without proper credentials", (done) => {
    const order_id = "abc123";
    const options = {
      method: "GET",
      url: `/order_item/${order_id}`
    };
    server.inject(options, (response) => {
      assert.equal(response.statusCode, 401);
      assert.equal(
        response.headers["WWW-Authenticate"],
        "Basic"
      );
      done();
    });
  });

  it("returns a 404 Not Found error when order item is not found", (done) => {
    const order_id = "invalid";
    const options = {
      method: "GET",
      url: `/order_item/${order_id}`,
      headers: {
        Authorization: "Basic dXNlcm5hbWU6cGFzc3dvcmQ="
      }
    };
    server.inject(options, (response) => {
      const { payload } = response;
      assert.equal(response.statusCode, 404);
      assert.deepEqual(JSON.parse(payload), {
        message: "Order item not found"
      });
      done();
    });
  });
});


describe("DELETE /order_item/:id", () => {
  it("should delete an existing order item", async () => {
    const response = await request(app)
      .delete("/order_item/123")
      .expect(204);
    expect(response.body).toEqual({});
  });

  it("should return a 404 error if the order item does not exist", async () => {
    const response = await request(app)
      .delete("/order_item/999")
      .expect(404);
    expect(response.body).toEqual({ message: "Order item with id 999 not found" });
  });
});

describe("PUT /account", () => {
  it("updates a seller's account", async () => {
    const res = await request(app)
      .put("/account")
      .send({ seller_id: "123", seller_city: "San Francisco", seller_state: "California" });
    assert.equal(res.statusCode, 204);
  });
});

